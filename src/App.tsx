import React, { useState } from 'react';
import { useInvestStore } from './hooks/useInvestStore';
import { ActiveTab, BottomNav } from './components/BottomNav';
import { DesktopTabBar } from './components/DesktopTabBar';
import { Navbar } from './components/Navbar';
import { PortfolioOverview } from './components/PortfolioOverview';
import { DividendCalendar } from './components/DividendCalendar';
import { AnalyticsView } from './components/AnalyticsView';
import { CashflowView } from './components/CashflowView';
import { DepositsAndLoansView } from './components/DepositsAndLoansView';
import { TransactionHistoryView } from './components/TransactionHistoryView';
import { TransactionModal } from './components/TransactionModal';
import { BrokerImportModal } from './components/BrokerImportModal';
import { ExportModal } from './components/ExportModal';
import { PortfolioManageModal } from './components/PortfolioManageModal';
import { NewAssetModal } from './components/NewAssetModal';
import { EditAssetPriceModal } from './components/EditAssetPriceModal';
import { TickerManagerModal } from './components/TickerManagerModal';
import { exportTransactionsToCSV } from './utils/exportImport';
import { TransactionType } from './types';

export default function App() {
  const store = useInvestStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('BUY');
  const [txModalTicker, setTxModalTicker] = useState<string>('');

  const [isBrokerImportOpen, setIsBrokerImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPortfolioManageOpen, setIsPortfolioManageOpen] = useState(false);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalTicker, setPriceModalTicker] = useState<string>('SBER');
  const [isTickerManagerOpen, setIsTickerManagerOpen] = useState(false);

  const handleOpenTransaction = (type: TransactionType = 'BUY', ticker: string = '') => {
    setTxModalType(type);
    setTxModalTicker(ticker);
    setIsTxModalOpen(true);
  };

  const handleOpenPriceEditor = (ticker?: string) => {
    if (ticker) setPriceModalTicker(ticker);
    setIsPriceModalOpen(true);
  };

  const handleSelectAssetToBuy = (ticker: string) => {
    handleOpenTransaction('BUY', ticker);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navbar */}
      <Navbar
        portfolios={store.portfolios}
        selectedPortfolioId={store.selectedPortfolioId}
        onSelectPortfolio={store.setSelectedPortfolioId}
        onOpenNewTransaction={() => handleOpenTransaction('BUY')}
        onOpenBrokerImport={() => setIsBrokerImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPortfolioManager={() => setIsPortfolioManageOpen(true)}
        onOpenPriceEditor={() => handleOpenPriceEditor()}
        onOpenTickerManager={() => setIsTickerManagerOpen(true)}
        onRefreshQuotes={store.refreshMarketQuotes}
        totalPortfoliosValue={store.summary.totalValue}
        activeCurrency={store.activeCurrency}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-12 space-y-5">
        {/* Desktop Tab Bar */}
        <div className="flex items-center justify-between gap-4">
          <DesktopTabBar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            positionsCount={store.holdings.length}
            depositsAndLoansCount={store.deposits.length + store.loans.length}
          />

          {/* Quick Active Portfolio Info for Large Screens */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
            <span>
              Портфель: <strong className="text-white">{store.currentPortfolio?.name}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>Валюта: <strong className="text-emerald-400 font-mono">{store.activeCurrency}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Капитал: <strong className="text-white font-mono">{store.netWorth.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {store.activeCurrency === 'RUB' ? '₽' : '$'}</strong></span>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'overview' && (
          <PortfolioOverview
            portfolio={store.currentPortfolio}
            summary={store.summary}
            holdings={store.holdings}
            currency={store.activeCurrency}
            onOpenNewTransaction={handleOpenTransaction}
            onOpenBrokerImport={() => setIsBrokerImportOpen(true)}
            onOpenNewAssetModal={() => setIsNewAssetOpen(true)}
            onOpenPriceEditor={handleOpenPriceEditor}
            onOpenTickerManager={() => setIsTickerManagerOpen(true)}
            onNavigateToDividends={() => setActiveTab('dividends')}
          />
        )}

        {activeTab === 'dividends' && (
          <DividendCalendar
            monthlyDividends={store.monthlyDividends}
            holdings={store.holdings}
            currency={store.activeCurrency}
            onRecordDividend={(ticker, isCoupon) => handleOpenTransaction(isCoupon ? 'COUPON' : 'DIVIDEND', ticker)}
          />
        )}

        {activeTab === 'wealth' && (
          <DepositsAndLoansView
            deposits={store.deposits}
            loans={store.loans}
            currency={store.activeCurrency}
            depositsSummary={store.depositsSummary}
            loansSummary={store.loansSummary}
            portfolioTotalValue={store.summary.totalValue}
            portfolioMonthlyDividends={store.summary.monthlyAverageDividend}
            netWorth={store.netWorth}
            onAddDeposit={store.addDeposit}
            onDeleteDeposit={store.deleteDeposit}
            onAccrueInterest={store.accrueDepositInterest}
            onTopUpDeposit={store.topUpDeposit}
            onWithdrawDeposit={store.withdrawDeposit}
            onAddDepositRateChange={store.addDepositRateChange}
            onDeleteDepositRateChange={store.deleteDepositRateChange}
            onDeleteDepositOperation={store.deleteDepositOperation}
            onUpdateDeposit={store.updateDeposit}
            onAddLoan={store.addLoan}
            onDeleteLoan={store.deleteLoan}
            onMakeLoanPayment={store.makeLoanPayment}
          />
        )}

        {activeTab === 'cashflow' && (
          <CashflowView
            cashflow={store.cashflow}
            currency={store.activeCurrency}
            onAddEntry={store.addCashflowEntry}
            onDeleteEntry={store.deleteCashflowEntry}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            holdings={store.holdings}
            currency={store.activeCurrency}
            summary={store.summary}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistoryView
            transactions={store.transactions}
            currency={store.activeCurrency}
            onDeleteTransaction={store.deleteTransaction}
            onNewTransaction={() => handleOpenTransaction('BUY')}
            onExportCSV={() => exportTransactionsToCSV(store.transactions, store.currentPortfolio?.name || 'portfolio')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={store.addTransaction}
        portfolioId={store.selectedPortfolioId}
        currency={store.activeCurrency}
        initialType={txModalType}
        initialTicker={txModalTicker}
        quotes={store.quotes}
      />

      <BrokerImportModal
        isOpen={isBrokerImportOpen}
        onClose={() => setIsBrokerImportOpen(false)}
        onImportBatch={store.addTransactionsBatch}
        portfolioId={store.selectedPortfolioId}
        portfolioName={store.currentPortfolio?.name || 'Портфель'}
        currency={store.activeCurrency}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentPortfolio={store.currentPortfolio}
        holdings={store.holdings}
        transactions={store.transactions}
        allTransactions={store.allTransactions}
        portfolios={store.portfolios}
        quotes={store.quotes}
        cashflow={store.cashflow}
        deposits={store.deposits}
        loans={store.loans}
        currency={store.activeCurrency}
        onRestoreBackup={store.restoreBackup}
        onResetDemo={store.resetToDemoData}
      />

      <PortfolioManageModal
        isOpen={isPortfolioManageOpen}
        onClose={() => setIsPortfolioManageOpen(false)}
        portfolios={store.portfolios}
        selectedPortfolioId={store.selectedPortfolioId}
        onSelectPortfolio={store.setSelectedPortfolioId}
        onAddPortfolio={store.addPortfolio}
        onUpdatePortfolio={store.updatePortfolio}
        onDeletePortfolio={store.deletePortfolio}
      />

      <NewAssetModal
        isOpen={isNewAssetOpen}
        onClose={() => setIsNewAssetOpen(false)}
        onSaveAssetQuote={store.updateQuote}
        onSelectAssetToBuy={handleSelectAssetToBuy}
        onEditPrice={handleOpenPriceEditor}
        onOpenTickerManager={() => setIsTickerManagerOpen(true)}
        currency={store.activeCurrency}
        existingQuotes={store.quotes}
      />

      {/* Manual Asset Price & Quote Editor Modal */}
      <EditAssetPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        initialTicker={priceModalTicker}
        quotes={store.quotes}
        holdings={store.holdings}
        currency={store.activeCurrency}
        onSetAssetPrice={store.setAssetPrice}
      />

      {/* Ticker & Asset Database Manager Modal (Lots, Splits, CRUD) */}
      <TickerManagerModal
        isOpen={isTickerManagerOpen}
        onClose={() => setIsTickerManagerOpen(false)}
        quotes={store.quotes}
        holdings={store.holdings}
        allTransactions={store.allTransactions}
        currency={store.activeCurrency}
        onSaveQuote={store.saveQuote}
        onDeleteQuote={store.deleteQuote}
        onSplitTicker={store.splitTicker}
        onOpenPriceEditor={handleOpenPriceEditor}
      />
    </div>
  );
}
