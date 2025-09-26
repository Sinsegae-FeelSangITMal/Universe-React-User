import { useState } from "react";

export default function OrderPage() {

    const [selectedPayment, setSelectedPayment] = useState(""); // 결제수단 선택

    return (
        <main className="custom-background">
            <div className="container">
                <div className="section-top-border">
                    <div className="row">

                        {/* 왼쪽 영역 */}
                        <div className="col-lg-8 col-md-8">
                            <form action="#">
                                <h2 className="mb-20" style={{fontWeight: 700}}>주문서</h2>

                                <div className="custom-box">
                                    <h3 className="mb-30">주문 상품</h3>
                                    <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                                        <img src="assets/img/elements/a.jpg" style={{width: "80px", height: "80px", marginRight: "15px"}}/>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600 }}>The 1st Mini Album</p>
                                            <p style={{ margin: 0 }}>1개</p>
                                            <p style={{ margin: 0 }}>
                                                <b style={{ fontWeight: 400 }}>KRW</b>{" "}
                                                <b style={{ fontWeight: 600 }}>￦13,300</b>
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                                        <img src="assets/img/elements/a.jpg" style={{width: "80px", height: "80px", marginRight: "15px"}}/>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600 }}>The 1st Mini Album</p>
                                            <p style={{ margin: 0 }}>1개</p>
                                            <p style={{ margin: 0 }}>
                                                <b style={{ fontWeight: 400 }}>KRW</b>{" "}
                                                <b style={{ fontWeight: 600 }}>￦13,300</b>
                                            </p>
                                        </div>
                                    </div>

                                    <hr/>

                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                        <span>총 상품 금액 (2개)</span>
                                        <span>KRW ￦52,600</span>
                                    </div>
                                </div>

                                <div className="custom-box">
                                    <h3 className="mb-30">주문자</h3>
                                    <div className="mt-10">
                                        <h5>성</h5>
                                        <input type="text" name="last_name1" placeholder="성 입력 (영어)" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>이름</h5>
                                        <input type="text" name="first_name1" placeholder="이름 입력 (영어)" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>이메일</h5>
                                        <input type="email" name="EMAIL" placeholder="이메일 입력" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>전화번호</h5>
                                        <input type="tel" name="TEL1" placeholder="전화번호 입력 (숫자)" className="single-input" />
                                    </div>
                                </div>

                                <div className="custom-box">
                                    <h3 className="mb-30">배송 정보</h3>
                                    <div className="mt-10">
                                        <h5>성</h5>
                                        <input type="text" name="last_name2" placeholder="성 입력 (영어)" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>이름</h5>
                                        <input type="text" name="first_name2" placeholder="이름 입력 (영어)" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>배송국가/지역</h5>
                                        <div id="default-select">
                                            <select className="form-select order">
                                                <option value="0">배송국가/지역 선택</option>
                                                <option value="1">한국</option>
                                                <option value="1">미국</option>
                                                <option value="1">캐나다</option>
                                                <option value="1">대만</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-10">
                                        <h5>주소</h5>
                                        <input type="text" name="address" placeholder="주소 입력 (영어)" className="single-input" />
                                        <input type="text" name="address_detail" placeholder="상세 주소 입력 (선택, 영어)" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>도시</h5>
                                        <input type="text" name="city" placeholder="도시 입력" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>주/도/지역</h5>
                                        <input type="text" name="state" placeholder="주/도/지역 입력" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>우편번호</h5>
                                        <input type="text" name="postal" placeholder="우편번호 입력" className="single-input" />
                                    </div>
                                    <div className="mt-10">
                                        <h5>전화번호</h5>
                                        <input type="tel" name="TEL2" placeholder="전화번호 입력 (숫자)" className="single-input" />
                                    </div>
                                </div>
                            </form>
                        </div>


                        {/* 오른쪽 영역 */}
                        <div className="col-lg-4 mt-45 col-md-4 mt-sm-30">

                            <div className="custom-box">

                                <h3 className="mb-20">결제 금액</h3>

                                <div style={{ marginBottom: "7px", fontSize:"14px", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                    <span style={{ fontWeight: "500"}}>상품 금액</span>
                                    <span>KRW ￦52,600</span>
                                </div>
                                <div className="mb-30" style={{ fontSize:"14px", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                                    <span style={{ fontWeight: "500"}}>배송비</span>
                                    <span>KRW ￦2,500</span>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                    <span>총 상품 금액 (2개)</span>
                                    <span>KRW ￦52,600</span>
                                </div>
                                <hr/>

                                <h3 className="mb-10">결제 수단</h3>
                                <div class="button-group-area">
                                    {/* 카드 */}
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedPayment("card");
                                        }}
                                        className={`genric-btn radius card primary${selectedPayment === "card" ? "" : "-border"}`}
                                    >
                                        체크/신용카드
                                    </a>

                                    {/* 계좌이체 */}
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedPayment("transfer");
                                        }}
                                        className={`genric-btn radius card primary${selectedPayment === "transfer" ? "" : "-border"}`}
                                    >
                                        계좌이체
                                    </a>                                </div>
                                <div className="switch-wrap d-flex justify-content-between mt-20">
                                    <p>개인정보 수집 이용에 동의합니다</p>
                                    <div className="confirm-radio">
                                        <input type="checkbox" id="confirm-radio" />
                                        <label htmlFor="confirm-radio"></label>
                                    </div>
                                </div>

                                <a href="#" className="genric-btn primary radius pay" style={{ width: "100%" }}>결제하기</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
