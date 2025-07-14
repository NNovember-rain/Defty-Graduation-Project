import { Outlet } from "react-router-dom";
import "./AdminAuthLayout.scss";

function AdminAuthLayout() {
    return (
        <div className='admin-auth-layout'>
            <Outlet />
        </div>
    );
}

export default AdminAuthLayout;