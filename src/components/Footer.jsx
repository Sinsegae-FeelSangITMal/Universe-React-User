export default function Footer(){
    return (
    <footer>
    {/* <!-- Footer Start--> */}
    <div className="footer-area footer-padding">
        <div className="container-fluid ">
            <div className="row d-flex justify-content-between">
                <div className="col-xl-3 col-lg-3 col-md-8 col-sm-8">
                    <div className="single-footer-caption mb-50">
                        <div className="single-footer-caption mb-30">
                            {/* <!-- logo --> */}
                            <div className="footer-logo mb-35">
                            <a href="index.html"><img src="assets/img/logo/footLogo.png" alt="" style={{width: "150px"}}/></a>
                        </div>
                        <div className="footer-tittle">
                            <div className="footer-pera">
                                <p>팬들과 아티스트를 잇는 라이브 커머스형 아이돌 MD 플랫폼 (Live commerce-style idol MD platform connecting fans and artists)</p>
                            </div>
                        </div>
                        {/* <!-- social --> */}
                        <div className="footer-social">
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="https://bit.ly/sai4ull"><i className="fab fa-facebook-f"></i></a>
                            <a href="#"><i className="fab fa-pinterest-p"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-4">
                <div className="single-footer-caption mb-50">
                    <div className="footer-tittle">
                        <h4>Partner</h4>
                        <ul>
                            <li><a href="#">소속사 메인</a></li>
                            <li><a href="#">입점 문의</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-4">
                <div className="single-footer-caption mb-50">
                    <div className="footer-tittle">
                        <h4>All Day Commit</h4>
                        <ul>
                            <li><a href="#">Minji Kim</a></li>
                            <li><a href="#">Jungmin Mun</a></li>
                            <li><a href="#">Seungyeon Yang</a></li>
                            <li><a href="#">Hyunjik Yang</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="col-xl-1 col-lg-2 col-md-4 col-sm-4">
                <div className="single-footer-caption mb-50">
                    <div className="footer-tittle">
                        <h4>Species</h4>
                        <ul>
                            <li><a href="#">마라</a></li>
                            <li><a href="#">개</a></li>
                            <li><a href="#">사람</a></li>
                            <li><a href="#">음식</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-4">
                <div className="single-footer-caption mb-50">
                    <div className="footer-tittle">
                        <h4>@GitHub</h4>
                        <ul>
                            <li><a href="#">https://github.com/minStackRoom</a></li>
                            <li><a href="#">https://github.com/munjungmin</a></li>
                            <li><a href="#">https://github.com/eyoreee</a></li>
                            <li><a href="#">https://github.com/JiksGit</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-4">
                <div className="single-footer-caption mb-50">
                    <div className="footer-tittle">
                        <h4>Team Project</h4>
                        <ul>
                            <li><a href="https://github.com/Sinsegae-FeelSangITMal">@Team GitHub</a></li>
                            <li><a href="https://github.com/Sinsegae-FeelSangITMal/OliveMain">Team Project #1 Oliveyoung</a></li>
                            <li><a href="https://github.com/Sinsegae-FeelSangITMal/HotSource">Team Project #2 HotSource</a></li>
                            <li><a href="https://github.com/Sinsegae-FeelSangITMal/Universe">Team Project #3 Universe</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
{/* <!-- footer-bottom area --> */}
<div className="footer-bottom-area">
    <div className="container">
        <div className="footer-border">
           <div className="row d-flex align-items-center">
               <div className="col-xl-12 ">
                   <div className="footer-copy-right text-center">
                       <p>
                        {/* <!-- Link back to Colorlib can't be removed. Template is licensed under CC BY 3.0. --> */}
                          Copyright &copy;<script>document.write(new Date().getFullYear());</script> All rights reserved | This template is made with <i className="fa fa-heart" aria-hidden="true"></i> by <a href="https://colorlib.com" target="_blank">Colorlib</a>
                          {/* <!-- Link back to Colorlib can't be removed. Template is licensed under CC BY 3.0. --> */}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
  {/* <!-- Footer End--> */}
</footer>
    )
}