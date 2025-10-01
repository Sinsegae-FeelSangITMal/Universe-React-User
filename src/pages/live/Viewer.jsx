 import React, { useState, useRef, useEffect } from 'react';                                                                                                                                             
  import { io } from 'socket.io-client';                                                                                                                                                                  
  import * as mediasoupClient from 'mediasoup-client';                                                                                                                                                    

  // --- 중요! ---                                                                                                                                                                                        
  // 서버의 IP 주소를 여기에 입력하세요.                                                                                                                                                                  
  // config.js에서 announcedIp에 입력한 값과 동일해야 합니다.                                                                                                                                             
  const SERVER_URL = 'http://192.168.60.30:4000';                                                                                                                                                       

  // 구매자의 라이브 스트림 시청 기능을 담당하는 컴포넌트                                                                                                                                                 
  const Viewer = () => {                                                                                                                                                                                  
    const remoteVideoRef = useRef(null);                                                                                                                                                                  
    const [isStreamAvailable, setIsStreamAvailable] = useState(false);                                                                                                                                    

    useEffect(() => {                                                                                                                                                                                     
      const socketInstance = io(SERVER_URL);                                                                                                                                                              

      // 컴포넌트가 처음 로드될 때 스트림 수신을 시도합니다.                                                                                                                                              
      socketInstance.on('connect', () => {                                                                                                                                                                
        consumeStream(socketInstance);                                                                                                                                                                    
      });                                                                                                                                                                                                 

      // 컴포넌트가 사라질 때 소켓 연결을 완전히 해제합니다.                                                                                                                                              
      return () => {                                                                                                                                                                                      
        socketInstance.disconnect();                                                                                                                                                                      
      };                                                                                                                                                                                                  
    }, []);                                                                                                                                                                                               

    // 서버로부터 스트림을 받아오는(consume) 함수                                                                                                                                                         
    const consumeStream = async (socketInstance) => {                                                                                                                                                     
      try {                                                                                                                                                                                               
        const routerRtpCapabilities = await new Promise((resolve) => {                                                                                                                                    
          socketInstance.emit('getRouterRtpCapabilities', resolve);                                                                                                                                       
        });                                                                                                                                                                                               
        const device = new mediasoupClient.Device();                                                                                                                                                      
        await device.load({ routerRtpCapabilities });                                                                                                                                                     

        const transportParams = await new Promise((resolve) => {                                                                                                                                          
          socketInstance.emit('createWebRtcTransport', { sending: false }, resolve);                                                                                                                      
        });                                                                                                                                                                                               
        const recvTransport = device.createRecvTransport(transportParams);                                                                                                                                

        recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {                                                                                                                          
          socketInstance.emit('connectTransport', { dtlsParameters }, () => {                                                                                                                             
            callback();                                                                                                                                                                                   
          });                                                                                                                                                                                             
        });                                                                                                                                                                                               

        const consumerParams = await new Promise((resolve) => {                                                                                                                                           
          socketInstance.emit('consume', { rtpCapabilities: device.rtpCapabilities }, resolve);                                                                                                           
        });                                                                                                                                                                                               

        // 서버가 "시청 가능한 방송 없음" 등 에러를 보냈는지 확인                                                                                                                                         
        if (consumerParams.error) {                                                                                                                                                                       
          console.warn('스트림을 수신할 수 없습니다:', consumerParams.error);                                                                                                                             
          setIsStreamAvailable(false);                                                                                                                                                                    

          // 스트림이 없으므로, 'new-producer' 이벤트를 한번만 기다려서 다시 시도합니다.                                                                                                                  
          socketInstance.once('new-producer', () => {                                                                                                                                                     
            console.log('새로운 방송이 시작되었습니다. 다시 시청을 시도합니다...');                                                                                                                       
            consumeStream(socketInstance);                                                                                                                                                                
          });                                                                                                                                                                                             
          return;                                                                                                                                                                                         
        }                                                                                                                                                                                                 

        const consumer = await recvTransport.consume(consumerParams);                                                                                                                                     
        const { track } = consumer;                                                                                                                                                                       

        if (remoteVideoRef.current) {                                                                                                                                                                     
          remoteVideoRef.current.srcObject = new MediaStream([track]);                                                                                                                                    
        }                                                                                                                                                                                                 

        setIsStreamAvailable(true);                                                                                                                                                                       

        await new Promise(resolve => socketInstance.emit('resume-consumer', resolve));                                                                                                                    

      } catch (error) {                                                                                                                                                                                   
        console.error('스트림 수신 실패:', error);                                                                                                                                                        
        setIsStreamAvailable(false);                                                                                                                                                                      
      }                                                                                                                                                                                                   
    };                                                                                                                                                                                                    

    return (                                                                                                                                                                                              
      <div>                                                                                                                                                                                               
        <h2>라이브 시청 페이지</h2>                                                                                                                                                                       
        <video ref={remoteVideoRef} autoPlay style={{ width: '400px', border: '1px solid black' }} />                                                                                                     
        {!isStreamAvailable && <p>방송 시작을 기다리는 중...</p>}                                                                                                                                         
      </div>                                                                                                                                                                                              
    );                                                                                                                                                                                                    
  };                                                                                                                                                                                                      

  export default Viewer;    