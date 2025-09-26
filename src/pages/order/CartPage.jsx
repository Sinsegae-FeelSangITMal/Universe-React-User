import { useState } from "react";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([
        { id: 1, company: "SM Entertainment", name: "The 1st Mini Album", price: 13300, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
        { id: 2, company: "SM Entertainment", name: "The 1st Mini Album", price: 13300, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
        { id: 3, company: "JYP Entertainment", name: "The 2nd Mini Album", price: 15000, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
    ]);

    // 전체 선택 여부
    const allChecked = cartItems.every(item => item.checked);

    // 전체 선택 토글
    const handleAllCheck = (checked) => {
        setCartItems(cartItems.map(item => ({ ...item, checked })));
    };

    // 개별 선택 토글
    const handleCheck = (id, checked) => {
        setCartItems(cartItems.map(item => item.id === id ? { ...item, checked } : item));
    };

    // 선택 삭제
    const handleDeleteSelected = () => {
        const selectedIds = cartItems.filter(item => item.checked).map(item => item.id);
        console.log("삭제할 ID:", selectedIds);
        setCartItems(cartItems.filter(item => !item.checked));
    };

    // 수량 변경
    const handleQtyChange = (id, qty) => {
        setCartItems(cartItems.map(item => item.id === id ? { ...item, qty } : item));
    };

    // 총 금액
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // 소속사별 그룹핑
    const groupedItems = cartItems.reduce((acc, item) => {
        if (!acc[item.company]) acc[item.company] = [];
        acc[item.company].push(item);
        return acc;
    }, {});

    return (
        <main className="custom-background">
            <div className="container">
                <div className="section-top-border">
                    <div className="row">
                        <div className="col-lg-12 col-md-12">
                            <form action="#">
                                <h2 className="mb-40" style={{ fontWeight: 700 }}>장바구니</h2>

                                {/* 전체 선택 + 선택 삭제 */}
                                <div className="cart-custom two">
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <div className="primary-checkbox cart">
                                            <input
                                                type="checkbox"
                                                id="check-all"
                                                checked={allChecked}
                                                onChange={(e) => handleAllCheck(e.target.checked)}
                                            />
                                            <label htmlFor="check-all" />
                                        </div>
                                        <span style={{ marginLeft: "8px" }}>전체 선택</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="genric-btn primary radius card select"
                                        onClick={handleDeleteSelected}
                                    >
                                        선택 삭제
                                    </button>
                                </div>

                                {/* 소속사별로 그룹핑해서 출력 */}
                                {Object.entries(groupedItems).map(([company, items]) => (
                                    <div key={company} className="custom-box">
                                        <h3 className="mb-30">{company}</h3>
                                        <hr />

                                        {items.map(item => (
                                            <div key={item.id} className="cart-custom ckbox">
                                                {/* 개별 체크박스 */}
                                                <div className="primary-checkbox cart">
                                                    <input
                                                        type="checkbox"
                                                        id={`check-item-${item.id}`}
                                                        checked={item.checked}
                                                        onChange={(e) => handleCheck(item.id, e.target.checked)}
                                                    />
                                                    <label htmlFor={`check-item-${item.id}`} />
                                                </div>

                                                {/* 이미지 */}
                                                <img src={item.img} className="cart-custom pdimg" />

                                                {/* 상품 정보 */}
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                                                    <p style={{ margin: "5px 0" }}>옵션: 기본</p>

                                                    {/* 수량 선택 */}
                                                    <select
                                                        className="form-select order"
                                                        value={item.qty}
                                                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10))}
                                                    >
                                                        {[1, 2, 3, 4, 5].map(n => (
                                                            <option key={n} value={n}>{n}개</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* 가격 + 삭제 */}
                                                <div className="cart-custom one">
                                                    <p style={{ margin: 0, fontWeight: 600, whiteSpace: "nowrap" }}>
                                                        KRW {item.price.toLocaleString()}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="genric-btn primary-border small radius card delete"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {/* 합계 영역 */}
                                <div className="cart-footer-bar">
                                    <span>
                                        상품 금액 KRW {totalPrice.toLocaleString()} + 배송비 별도 = 총 예상 금액 ({cartItems.length}개)
                                    </span>
                                    <button type="button" className="genric-btn primary radius pay">
                                        {cartItems.length}개 상품 주문하기
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
