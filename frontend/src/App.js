import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import HomeSelector from "@/pages/HomeSelector";
import NotificationGenerator from "@/pages/NotificationGenerator";
import ElectronicaGenerator from "@/pages/ElectronicaGenerator";

function App() {
  return (
    <div className="App cgr-bg-pattern" data-testid="cgr-app-root">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeSelector />} />
          <Route path="/aviso" element={<NotificationGenerator />} />
          <Route path="/electronica" element={<ElectronicaGenerator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
