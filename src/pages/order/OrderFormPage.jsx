import { useState } from "react";
import { useLocation } from "react-router-dom";
import { submitOrder } from "../../utils/OrderApi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function OrderSubmitPage() {

    const [selectedPayment, setSelectedPayment] = useState(""); // 결제수단 선택
    const location = useLocation();
    const selectedItems = location.state?.items || []; // CartPage에서 선택된 항목들
    const { user } = useAuthStore(); 
    const navigate = useNavigate();

    // 주문자, 배송지, 동의 상태 관리
    const [orderer, setOrderer] = useState({
        name: "",
        email: user.email
    });
    const [receiver, setReceiver] = useState({
        name: "",
        country: "",
        address: "",
        addressDetail: "",
        city: "",
        state: "",
        postal: "",
        phone: ""
    });
    const [agree, setAgree] = useState(false);

    // 총 가격 계산
    const totalPrice = selectedItems
        .reduce((sum, item) => sum + item.price * item.qty, 0);

    // 주문 상품 수량 합계
    const totalQty = selectedItems
        .reduce((sum, item) => sum + item.qty, 0);

    // 소속사(파트너)별 3000원씩 배송비
    const totalShipPrice = () => {
        const partnerSet = new Set(selectedItems.map(item => item.company || item.partnerName));
        return partnerSet.size * 3000;
    }

    // 결제 버튼 클릭 시 payload 구성
    const handlePay = async() => {
        if (!validate()) return; // 검증 실패 시 중단

        const payload = {
            userId: user.userId,
            orderer,
            receiver,
            paymentMethod: selectedPayment,
            items: selectedItems.map(i => ({
                productId: i.productId,
                qty: i.qty,
                price: i.price
            })),
            totalPrice: totalPrice + totalShipPrice(),
            agree
        };

        console.log("주문서 payload:", payload);

        //e.preventDefault();
        try {
            const res = await submitOrder(payload);
            console.log(res.data.data);
            window.location.href=`${res.data.data.redirectUrl}?orderId=${res.data.data.orderId}`;// 결제창으로 이동 

            //navigate(`/order/paid/${res.data.data}`); // 주문 완료 페이지로 이동
        } catch (err) {
            console.error(err);
            // navigate(`/unpaid/${orderId}`); // 주문 실패 페이지로 이동
        }
    };

    // 항목 검증 함수
    const validate = () => {
        if (!orderer.name || !orderer.email) {
            alert("주문자 정보를 모두 입력해주세요.");
            return false;
        }
        if (!receiver.name || !receiver.country || !receiver.address || !receiver.city || !receiver.postal || !receiver.phone) {
            alert("배송 정보를 모두 입력해주세요.");
            return false;
        }
        if (!selectedPayment) {
            alert("결제 수단을 선택해주세요.");
            return false;
        }
        if (!agree) {
            alert("개인정보 수집 및 이용에 동의해야 합니다.");
            return false;
        }
        return true;
    };

    // 전화번호 자동 포맷팅 함수
    const formatPhoneNumber = (value)=> {
        // 숫자만 남기기
        const num = value.replace(/[^0-9]/g, "");
        if (num.length < 4) return num;
        if (num.length < 7) return num.slice(0, 3) + "-" + num.slice(3);
        if (num.length < 11) return num.slice(0, 3) + "-" + num.slice(3, 6) + "-" + num.slice(6);
        return num.slice(0, 3) + "-" + num.slice(3, 7) + "-" + num.slice(7, 11);
    };

    return (
        <main className="custom-background">
            <div className="container">
                <div className="section-top-border">
                    <div className="row">

                        {/* 왼쪽 영역 */}
                        <div className="col-lg-8 col-md-8">
                            <form action="#">
                                <h2 className="mb-20" style={{ fontWeight: 700 }}>주문서</h2>

                                <div className="custom-box">
                                    <h3 className="mb-30">주문 상품</h3>
                                    {selectedItems.map(item => (
                                        <div key={item.id} style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                                            <img src={item.img} style={{ width: "80px", height: "80px", marginRight: "15px" }} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                                                <p style={{ margin: 0 }}>{item.qty}개</p>
                                                <p style={{ margin: 0 }}>
                                                    <b style={{ fontWeight: 400 }}>KRW</b>{" "}
                                                    <b style={{ fontWeight: 600 }}>￦{item.price.toLocaleString()}</b>
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    <hr />

                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                        <span>총 상품 금액 ({totalQty}개)</span>
                                        <span>KRW ￦{totalPrice.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="custom-box">
                                    <h3 className="mb-30">주문자</h3>
                                    <div className="mt-10">
                                        <h5>이름</h5>
                                        <input type="text" name="first_name1" placeholder="이름 입력 (영어)" className="single-input"
                                            value={orderer.name}
                                            onChange={(e) => setOrderer({ ...orderer, name: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>이메일</h5>
                                        <input type="email" name="EMAIL" placeholder="이메일 입력" className="single-input"
                                            value={orderer.email}
                                            onChange={(e) => setOrderer({ ...orderer, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="custom-box">
                                    <h3 className="mb-30">배송 정보</h3>
                                    <div className="mt-10">
                                        <h5>이름</h5>
                                        <input type="text" name="first_name2" placeholder="이름 입력 (영어)" className="single-input"
                                            value={receiver.name}
                                            onChange={(e) => setReceiver({ ...receiver, name: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>배송국가/지역</h5>
                                        <div id="default-select">
                                            <select className="form-select order"
                                                value={receiver.country}
                                                onChange={(e) => setReceiver({ ...receiver, country: e.target.value })}>
                                                <option value="0">배송국가/지역 선택</option>
                                                <option value="KR">한국</option>
                                                <option value="US">미국</option>
                                                <option value="CA">캐나다</option>
                                                <option value="TW">대만</option>
                                                <option value="CN">중국</option>
                                                <option value="JP">일본</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-10">
                                        <h5>주소</h5>
                                        <input type="text" name="address" placeholder="주소 입력 (영어)" className="single-input"
                                            value={receiver.address}
                                            onChange={(e) => setReceiver({ ...receiver, address: e.target.value })} />
                                        <input type="text" name="address_detail" placeholder="상세 주소 입력 (선택, 영어)" className="single-input"
                                            value={receiver.addressDetail}
                                            onChange={(e) => setReceiver({ ...receiver, addressDetail: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>도시</h5>
                                        <input type="text" name="city" placeholder="도시 입력" className="single-input"
                                            value={receiver.city}
                                            onChange={(e) => setReceiver({ ...receiver, city: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>주/도/지역</h5>
                                        <input type="text" name="state" placeholder="주/도/지역 입력" className="single-input"
                                            value={receiver.state}
                                            onChange={(e) => setReceiver({ ...receiver, state: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>우편번호</h5>
                                        <input type="text" name="postal" placeholder="우편번호 입력" className="single-input"
                                            value={receiver.postal}
                                            onChange={(e) => setReceiver({ ...receiver, postal: e.target.value })} />
                                    </div>
                                    <div className="mt-10">
                                        <h5>전화번호</h5>
                                        <input type="tel" name="TEL2" placeholder="전화번호 입력 (숫자)" className="single-input"
                                            value={receiver.phone}
                                            onChange={(e) => setReceiver({ ...receiver, phone: formatPhoneNumber(e.target.value) })} />
                                    </div>
                                </div>
                            </form>
                        </div>


                        {/* 오른쪽 영역 */}
                        <div className="col-lg-4 mt-45 col-md-4 mt-sm-30">

                            <div className="custom-box">

                                <h3 className="mb-20">결제 금액</h3>

                                <div style={{ marginBottom: "7px", fontSize: "14px", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                    <span style={{ fontWeight: "500" }}>상품 금액</span>
                                    <span>KRW ￦{totalPrice.toLocaleString()}</span>
                                </div>
                                <div className="mb-30" style={{ fontSize: "14px", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                    <span style={{ fontWeight: "500" }}>배송비</span>
                                    <span>KRW ￦{totalShipPrice(totalQty).toLocaleString()}</span>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                    <span>총 상품 금액 ({totalQty}개)</span>
                                    <span>KRW ￦{(totalPrice + totalShipPrice(totalQty)).toLocaleString()}</span>
                                </div>
                                <hr />

                                <h3 className="mb-10">결제 수단</h3>
                                <div className="button-group-area">
                                    {/* 토스페이 */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedPayment("TOSSPAY");
                                        }}
                                        className={`genric-btn radius card primary${selectedPayment === "TOSSPAY" ? "" : "-border"}`}
                                    >
                                        토스페이
                                    </button>

                                    {/* 카카오페이 */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedPayment("KAKAOPAY");
                                        }}
                                        className={`genric-btn radius card primary${selectedPayment === "KAKAOPAY" ? "" : "-border"}`}
                                    >
                                        카카오페이
                                    </button>
                                </div>
                                <div className="switch-wrap d-flex justify-content-between mt-20">
                                    <p>개인정보 수집 이용에 동의합니다</p>
                                    <div className="confirm-radio">
                                        <input type="checkbox"
                                            id="confirm-radio"
                                            checked={agree}
                                            onChange={(e) => setAgree(e.target.checked)} />
                                        <label htmlFor="confirm-radio"></label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="genric-btn primary radius pay"
                                    style={{ width: "100%" }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePay();
                                    }}
                                >결제하기</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
