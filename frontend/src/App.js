import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import NotificationGenerator from "@/pages/NotificationGenerator";

function App() {
  return (
    <div className="App cgr-bg-pattern" data-testid="cgr-app-root">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NotificationGenerator />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
