import { useEffect, useState } from "react";
import { getCart, updateCart, delCart } from "../../utils/CartApi";
import { useNavigate } from "react-router-dom";

export default function CartPage() {
    const [cartItems, setCartItems] = useState([]);
    const [draftQty, setDraftQty] = useState({});       // 선택 가능한 수량

    const navigate = useNavigate();

    const userId = 1;       // 임시 코드

    useEffect(() => { load(); }, []);

    const load = async () => {
        const cartList = await getCart(userId);
        const apiItems = cartList.data.data;

        // API 데이터를 프론트에서 쓰기 좋은 구조로 변환
        const converted = apiItems.map(item => ({
            id: item.id,                       // 장바구니 ID
            productId: item.product.id,        // 상품 ID
            company: item.product.partnerName, // 소속사
            name: item.product.name,           // 상품명
            desc: item.product.description,    // 상품 설명
            price: item.product.price,         // 가격
            qty: item.qty,                     // 담은 수량
            limit: item.product?.limit,        // 수량 제한
            stock: item.product.stock,         // 상품 재고
            img: item.product?.mainImageUrl ?? "assets/img/elements/b.jpg",  // 서버에 이미지 없으면 기본 이미지
            checked: false
        }));

        setCartItems(converted);
        // 선택 가능 수량 초기값 = 서버 수량
        setDraftQty(Object.fromEntries(converted.map(i => [i.id, i.qty])));
    };

    // 주문하기 클릭
    // 체크된 항목들만 OrderPage로 이동
    const handleOrder = () => {
        const selectedItems = cartItems.filter(i => i.checked);
        navigate('/order', { state: { items: selectedItems } });
    };

    // 전체 선택 여부
    const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);

    // 전체 선택 토글
    const handleAllCheck = (checked) => {
        setCartItems(prev => prev.map(item => ({ ...item, checked })));
    };

    // 개별 선택 토글
    const handleCheck = (id, checked) => {
        setCartItems(prev => prev.map(item => item.id === id ? { ...item, checked } : item));
    };

    // 개별 삭제
    const handleDelete = async (id) => {
        try {
            await delCart(id);
            setCartItems(prev => prev.filter(item => item.id !== id));
            setDraftQty(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제 실패\n다시 시도해주세요");
        }
    };

    // 선택 삭제
    const handleDeleteSelected = async () => {
        const selectedIds = cartItems.filter(item => item.checked).map(item => item.id);
        try {
            await Promise.all(selectedIds.map(id => delCart(id)));
            setCartItems(prev => prev.filter(item => !item.checked));
            setDraftQty(prev => {
                const next = { ...prev };
                selectedIds.forEach(id => delete next[id]);
                return next;
            });
        } catch (err) {
            console.error("선택 삭제 실패:", err);
            alert("삭제 실패\n다시 시도해주세요");
        }
    };

    // 수량 변경
    const handleQtyChange = async (id, qty) => {
        try {
            await updateCart(id, qty); // 서버 반영 (덮어쓰기)
            setCartItems(prev => prev.map(item => item.id === id ? { ...item, qty } : item));
            alert("수량이 변경되었습니다");
        } catch (err) {
            console.error("수량 수정 실패: ", err);
            alert("수정 실패\n다시 시도해주세요");
        }
    };

    // 체크된 항목만 합계 (수량 적용)
    const totalPrice = cartItems
        .filter(item => item.checked)
        .reduce((sum, item) => sum + item.price * item.qty, 0);

    // 체크된 항목 수량 합계
    const totalSelectedQty = cartItems
        .filter(i => i.checked)
        .reduce((sum, item) => sum + item.qty, 0);

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
                                                disabled={cartItems.length === 0}
                                            />
                                            <label htmlFor="check-all" />
                                        </div>
                                        <span style={{ marginLeft: "8px" }}>전체 선택</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="genric-btn primary radius card select"
                                        onClick={handleDeleteSelected}
                                        disabled={cartItems.every(i => !i.checked)}
                                    >
                                        선택 삭제
                                    </button>
                                </div>

                                {/* 비었으면 안내 문구, 아니면 그룹별 렌더 */}
                                {cartItems.length === 0 ? (
                                    <div className="custom-box" style={{ textAlign: "center", padding: "50px 0" }}>
                                        <p style={{ fontWeight: 600, fontSize: "18px", margin: 0 }}>
                                            장바구니에 항목이 없습니다
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* 소속사별로 그룹핑해서 출력 */}
                                        {Object.entries(groupedItems).map(([company, items]) => (
                                            <div key={company} className="custom-box">
                                                <h3 className="mb-30">{company}</h3>
                                                <hr />

                                                {items.map(item => {
                                                    const limit = item.limit; // -1: 무제한
                                                    const maxQty = limit === -1 ? 99 : Math.max(0, limit);
                                                    const selectedQty = draftQty[item.id] ?? item.qty;

                                                    return (
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
                                                                <p style={{ margin: "5px 0" }}>{item.desc}</p>

                                                                {/* 수량 선택 + 변경 버튼 + 재고 표시 */}
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <select
                                                                        className="form-select cart"
                                                                        value={selectedQty}
                                                                        onChange={(e) =>
                                                                            setDraftQty((prev) => ({
                                                                                ...prev,
                                                                                [item.id]: parseInt(e.target.value, 10),
                                                                            }))
                                                                        }
                                                                        disabled={maxQty === 0}
                                                                    >
                                                                        {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                                                                            <option key={n} value={n}>
                                                                                {n}개
                                                                            </option>
                                                                        ))}
                                                                    </select>

                                                                    <button
                                                                        type="button"
                                                                        className="genric-btn primary-border small radius qty edit"
                                                                        onClick={() => handleQtyChange(item.id, selectedQty)}
                                                                        disabled={maxQty === 0 || selectedQty === item.qty}
                                                                    >
                                                                        변경
                                                                    </button>

                                                                    {/* 재고 10개 미만일 때만 표시 */}
                                                                    {item.stock < 10 && (
                                                                        <span style={{ color: "red", fontWeight: 600, fontSize: "14px" }}>
                                                                            {item.stock}개 남음
                                                                        </span>
                                                                    )}
                                                                </div>
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
                                                    );
                                                })}
                                            </div>
                                        ))}

                                        {/* 합계 영역: 아이템 있을 때만 */}
                                        <div className="cart-footer-bar">
                                            <span>
                                                상품 금액 KRW {totalPrice.toLocaleString()} + 배송비 별도 = 총 예상 금액 ({totalSelectedQty}개)
                                            </span>
                                            <button
                                                type="button"
                                                className="genric-btn primary radius pay"
                                                disabled={cartItems.every(i => !i.checked)}
                                                onClick={handleOrder} 
                                            >
                                                {totalSelectedQty}개 상품 주문하기
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}