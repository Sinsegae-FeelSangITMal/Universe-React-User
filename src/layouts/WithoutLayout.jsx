import { Outlet } from "react-router-dom";

export default function WithoutLayout(){
    return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",      // 세로 중앙
        justifyContent: "center",  // 가로 중앙
      }}
    >
      <Outlet />
    </div>
  );
}