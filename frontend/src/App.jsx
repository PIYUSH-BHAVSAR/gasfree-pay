import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { UGFProvider } from '@tychilabs/react-ugf'
import Layout from './components/Layout'
import Home from './pages/Home'
import Pay from './pages/Pay'
import History from './pages/History'
import MerchantDashboard from './pages/MerchantDashboard'
import MerchantNew from './pages/MerchantNew'
import Widget from './pages/Widget'
import Onboard from './pages/Onboard'
import BadgeMint from './pages/BadgeMint'
import Profile from './pages/Profile'
import { WalletProvider } from './hooks/useWallet.jsx'

export default function App() {
  return (
    <WalletProvider>
      <UGFProvider mode="testnet">
        <BrowserRouter>
          <Routes>
            <Route path="/widget" element={<Widget />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/onboard" element={<Onboard />} />
              <Route path="/pay/:productId" element={<Pay />} />
              <Route path="/mint" element={<BadgeMint />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
              <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
              <Route path="/merchant/products/new" element={<MerchantNew />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UGFProvider>
    </WalletProvider>
  )
}
