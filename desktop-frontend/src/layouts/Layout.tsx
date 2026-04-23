import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Layout() {
    return (
        <div className="flex w-full h-screen bg-[#f8faf9] overflow-hidden text-gray-800">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}
