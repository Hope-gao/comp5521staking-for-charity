import React from "react";
import AdminPanel from "../components/AdminPanel";
import UserPanel from "../components/UserPanel";

function Dashboard({ user }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Staking Dashboard</h1>
      <p className="mb-2">
        当前身份：{user.isAdmin ? "管理员" : "普通用户"}
      </p>
      <p className="mb-4 text-sm text-gray-600">
        钱包地址：{user.address}
      </p>
      <p className="mb-4 text-sm text-gray-600">
        钱包地址：{user.address}
      </p>

      {/* ✅ 这里是关键：根据身份选择渲染哪个组件！ */}
      {user.isAdmin ? (
        <AdminPanel user={user} />
      ) : (
        <UserPanel user={user} />
      )}
    </div>
  );
}

export default Dashboard;