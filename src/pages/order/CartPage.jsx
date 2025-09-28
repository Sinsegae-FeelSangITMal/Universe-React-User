import { useEffect, useState } from "react";
import { getCart, updateCart, delCart } from "../../utils/CartApi";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([
        { id: 1, company: "SM Entertainment", name: "The 1st Mini Album", price: 13300, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
        { id: 2, company: "SM Entertainment", name: "The 1st Mini Album", price: 13300, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
        { id: 3, company: "JYP Entertainment", name: "The 2nd Mini Album", price: 15000, qty: 1, img: "assets/img/elements/a.jpg", checked: false },
    ]);

    const userId = 1;

    useEffect(() => {
        load()
    }, []);

    const load = async () => {
        const cartList = await getCart(userId);
        const apiItems = cartList.data.data;

        // API 데이터를 프론트에서 쓰기 좋은 구조로 변환
        const converted = apiItems.map(item => ({
            id: item.id,
            company: item.product.partnerName, // 소속사
            name: item.product.name,           // 상품명
            price: item.product.price,         // 가격
            qty: item.qty,                     // 수량
            img: "assets/img/elements/a.jpg",  // 서버에 이미지 없으면 기본 이미지
            checked: false
        }));

        setCartItems(converted);
    };

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

    // 개별 삭제
    const handleDelete = async (id) => {
        try {
            await delCart(id);   // 서버 반영
            setCartItems(cartItems.filter(item => item.id !== id));
        } catch (err) {
            console.error("삭제 실패:", err);
        }
    };

    // 선택 삭제
    const handleDeleteSelected = async () => {
        const selectedIds = cartItems.filter(item => item.checked).map(item => item.id);
        try {
            await Promise.all(selectedIds.map(id => delCart(id))); // 서버 호출 병렬 처리
            setCartItems(cartItems.filter(item => !item.checked));
        } catch (err) {
            console.error("선택 삭제 실패:", err);
        }
    };

    // 수량 변경
    const handleQtyChange = async (id, qty) => {
        try {
            await updateCart(id, qty);      // 서버에 전송
            setCartItems(cartItems.map(item => 
                item.id === id ? { ...item, qty } : item
            ));
        } catch (err) {
            console.error("수량 수정 실패: ", err);
        }
    };

    // 체크된 항목만 합계 (수량 적용)
    const totalPrice = cartItems
        .filter(item => item.checked) 
        .reduce((sum, item) => {
            const price = item.product ? item.product.price : item.price; // 변환 여부 대응
            return sum + price * item.qty;   // 🔑 수량 반영
    }, 0);

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

                                {/* 장바구니에 항목이 있는지 구분 후 없으면 문구 출력 */}
                                {/* 있으면 소속사별로 그룹핑해서 출력 */}
                                {cartItems.length === 0 ? (
                                    <div className="custom-box" style={{ textAlign: "center", padding: "50px 0" }}>
                                        <p style={{ fontWeight: 600, fontSize: "18px", margin: 0 }}>
                                            장바구니에 항목이 없습니다
                                        </p>
                                    </div>
                                ) : 
                                (
                                    Object.entries(groupedItems).map(([company, items]) => (
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
                                                        <p style={{ margin: "5px 0" }}>프로모션 증정품: 랜덤 포토카드 1종</p>

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
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            X
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}

                                {/* 합계 영역 */}
                                {cartItems.length > 0 && (
                                    <div className="cart-footer-bar">
                                        <span>
                                            상품 금액 KRW {totalPrice.toLocaleString()} + 배송비 별도 = 총 예상 금액 (
                                            {cartItems.filter(i => i.checked).reduce((sum, item) => sum + item.qty, 0)}개)
                                        </span>
                                        <button type="button" className="genric-btn primary radius pay">
                                            {cartItems.filter(i => i.checked).reduce((sum, item) => sum + item.qty, 0)}개 상품 주문하기
                                        </button>
                                    </div>
                                )}
                                
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
