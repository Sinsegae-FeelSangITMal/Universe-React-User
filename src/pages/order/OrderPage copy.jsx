import { useState } from "react";

export default function OrderPage() {
    const [showUserModal, setShowUserModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // 주문자 상태
    const [userInfo, setUserInfo] = useState({
        lastName: "Yang",
        firstName: "Seungyeon",
        email: "owhitekitty@gmail.com",
        phone: "+1 5879694189",
    });

    // 배송지 상태
    const [addressInfo, setAddressInfo] = useState({
        lastName: "Yang",
        firstName: "Seungyeon",
        country: "캐나다",
        address: "114 25 Avenue Northwest Calgary",
        detailAddress: "AB(T2M 2A3)",
        city: "Calgary",
        state: "AB",
        postalCode: "T2M 2A3",
        phone: "+1 5879694189",
    });

    // 주문자 모달 입력용
    const [tempUser, setTempUser] = useState(userInfo);

    // 배송지 모달 입력용
    const [tempAddress, setTempAddress] = useState(addressInfo);

    // 주문자 저장
    const saveUserInfo = (e) => {
        e.preventDefault();
        setUserInfo(tempUser);
        setShowUserModal(false);
    };

    // 배송지 저장
    const saveAddressInfo = (e) => {
        e.preventDefault();
        setAddressInfo(tempAddress);
        setShowAddressModal(false);
    };

    return (
        <main>
            <div className="container my-5">
                <h2 className="mb-4 fw-bold">주문서</h2>

                <div className="row">
                    {/* ---------------- 왼쪽 영역 ---------------- */}
                    <div className="col-lg-8">

                        {/* 주문 상품 */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-bold">주문 상품</div>
                            <div className="card-body">
                                <div className="d-flex justify-content-between mb-3">
                                    <div className="d-flex">
                                        <img
                                            src="assets/img/gallery/popular1.png"
                                            alt="상품1"
                                            style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                            className="me-3 rounded"
                                        />
                                        <div>
                                            <p className="mb-1">
                                                The 1st Mini Album [From JOY, with Love] (Jewel Case Ver.)
                                            </p>
                                            <small>1개</small>
                                        </div>
                                    </div>
                                    <span className="fw-bold">₩13,300</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <div className="d-flex">
                                        <img
                                            src="assets/img/gallery/popular2.png"
                                            alt="상품2"
                                            style={{ width: "60px", height: "60px", objectFit: "cover" }}
                                            className="me-3 rounded"
                                        />
                                        <div>
                                            <p className="mb-1">
                                                The 1st Mini Album [From JOY, with Love] (To You Ver.)
                                            </p>
                                            <small>1개</small>
                                        </div>
                                    </div>
                                    <span className="fw-bold">₩39,300</span>
                                </div>
                            </div>
                            <div className="card-footer text-end fw-bold">
                                총 상품금액 (2개): ₩52,600
                            </div>
                        </div>

                        {/* 주문자 */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">주문자</h5>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        setTempUser(userInfo); // 현재값 복사
                                        setShowUserModal(true);
                                    }}
                                >
                                    변경
                                </button>
                            </div>
                            <div className="card-body">
                                <p className="mb-1 fw-bold">
                                    {userInfo.lastName} {userInfo.firstName}
                                </p>
                                <p className="mb-1">{userInfo.email}</p>
                                <p className="mb-0">{userInfo.phone}</p>
                            </div>
                        </div>

                        {/* 배송 주소 */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-bold d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">배송 주소</h5>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        setTempAddress(addressInfo); // 현재값 복사
                                        setShowAddressModal(true);
                                    }}
                                >
                                    변경
                                </button>
                            </div>
                            <div className="card-body">
                                <p className="mb-1 fw-bold">
                                    {addressInfo.lastName} {addressInfo.firstName}
                                </p>
                                <p className="mb-1">{addressInfo.address}, {addressInfo.detailAddress}</p>
                                <p className="mb-1">
                                    {addressInfo.city}, {addressInfo.state}, {addressInfo.postalCode}
                                </p>
                                <p className="mb-1">{addressInfo.country}</p>
                                <p className="mb-0">{addressInfo.phone}</p>
                            </div>
                        </div>

                        {/* 배송 수단 */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-bold">배송 수단</div>
                            <div className="card-body">
                                <p className="text-muted small mb-3">
                                    택배사 사정에 따라 일정이 변동 되거나, 지역에 따라 추가 배송비가 부과 될 수 있습니다.
                                </p>

                                <div className="form-check d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <input
                                            className="form-check-input me-2"
                                            type="radio"
                                            name="shipping"
                                            id="shippingDHL"
                                            defaultChecked
                                        />
                                        <label className="form-check-label" htmlFor="shippingDHL">
                                            DHL <small className="text-muted ms-2">평균 배송 5-8일 소요</small>
                                        </label>
                                    </div>
                                    <span className="fw-bold">₩53,111</span>
                                </div>

                                <div className="form-check d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <input
                                            className="form-check-input me-2"
                                            type="radio"
                                            name="shipping"
                                            id="shippingCA"
                                        />
                                        <label className="form-check-label" htmlFor="shippingCA">
                                            CA <small className="text-muted ms-2">평균 배송 7-14일 소요</small>
                                        </label>
                                    </div>
                                    <span className="fw-bold">₩52,370</span>
                                </div>

                                <div className="form-check d-flex justify-content-between align-items-center">
                                    <div>
                                        <input
                                            className="form-check-input me-2"
                                            type="radio"
                                            name="shipping"
                                            id="shippingUPS"
                                        />
                                        <label className="form-check-label" htmlFor="shippingUPS">
                                            UPS <small className="text-muted ms-2">평균 배송 5-8일 소요</small>
                                        </label>
                                    </div>
                                    <span className="fw-bold">₩37,232</span>
                                </div>
                            </div>
                        </div>

                        {/* 결제 수단 */}
                        <div className="card mb-3 shadow-sm">
                            <div className="card-header fw-bold">결제 수단</div>
                            <div className="card-body d-flex">
                                <button className="btn btn-outline-primary w-50 me-2">체크/신용카드</button>
                                <button className="btn btn-outline-secondary w-50">퀵계좌이체</button>
                            </div>
                        </div>

                    </div>

                    {/* ---------------- 오른쪽 영역 ---------------- */}
                    <div className="col-lg-4">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="fw-bold mb-3">결제 금액</h5>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>상품 금액</span>
                                    <span>₩52,600</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>배송비</span>
                                    <span>₩37,232</span>
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between fw-bold mb-3">
                                    <span>총 결제 금액</span>
                                    <span>₩89,832</span>
                                </div>
                                <button className="btn btn-primary w-100">
                                    동의 후 ₩89,832 결제
                                </button>
                                <p className="small text-muted mt-2">
                                    이용약관을 확인했으며, 개인정보 수집·이용 및 제공에 동의합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* ----------- 주문자 변경 모달 ----------- */}
            {showUserModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">주문자 등록</h5>
                                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={saveUserInfo}>
                                    <div className="mb-3">
                                        <label className="form-label">성 (영어)</label>
                                        <input
                                            type="text"
                                            className="single-input"
                                            value={tempUser.lastName}
                                            onChange={(e) => setTempUser({ ...tempUser, lastName: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">이름 (영어)</label>
                                        <input
                                            type="text"
                                            className="single-input"
                                            value={tempUser.firstName}
                                            onChange={(e) => setTempUser({ ...tempUser, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">이메일</label>
                                        <input
                                            type="email"
                                            className="single-input"
                                            value={tempUser.email}
                                            onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">전화번호</label>
                                        <input
                                            type="tel"
                                            className="single-input"
                                            value={tempUser.phone}
                                            onChange={(e) => setTempUser({ ...tempUser, phone: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        저장
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ----------- 배송 주소 변경 모달 ----------- */}
            {showAddressModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">배송 주소 등록</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddressModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={saveAddressInfo}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">성 (영어)</label>
                                            <input
                                                type="text"
                                                className="single-input"
                                                value={tempAddress.lastName}
                                                onChange={(e) => setTempAddress({ ...tempAddress, lastName: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">이름 (영어)</label>
                                            <input
                                                type="text"
                                                className="single-input"
                                                value={tempAddress.firstName}
                                                onChange={(e) => setTempAddress({ ...tempAddress, firstName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">배송 국가/지역</label>
                                        <select
                                            className="form-select"
                                            value={tempAddress.country}
                                            onChange={(e) => setTempAddress({ ...tempAddress, country: e.target.value })}
                                        >
                                            <option>캐나다</option>
                                            <option>미국</option>
                                            <option>한국</option>
                                            <option>일본</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">주소</label>
                                        <input
                                            type="text"
                                            className="single-input"
                                            value={tempAddress.address}
                                            onChange={(e) => setTempAddress({ ...tempAddress, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">상세 주소</label>
                                        <input
                                            type="text"
                                            className="single-input"
                                            value={tempAddress.detailAddress}
                                            onChange={(e) => setTempAddress({ ...tempAddress, detailAddress: e.target.value })}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">도시</label>
                                            <input
                                                type="text"
                                                className="single-input"
                                                value={tempAddress.city}
                                                onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">주/도/지역</label>
                                            <input
                                                type="text"
                                                className="single-input"
                                                value={tempAddress.state}
                                                onChange={(e) => setTempAddress({ ...tempAddress, state: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">우편번호</label>
                                        <input
                                            type="text"
                                            className="single-input"
                                            value={tempAddress.postalCode}
                                            onChange={(e) => setTempAddress({ ...tempAddress, postalCode: e.target.value })}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">전화번호</label>
                                        <input
                                            type="tel"
                                            className="single-input"
                                            value={tempAddress.phone}
                                            onChange={(e) => setTempAddress({ ...tempAddress, phone: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100">
                                        저장
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
