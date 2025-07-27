
import React, { useState, useMemo, useCallback } from 'react';
import { Item, Loan, LoanStatus } from './types';
import LoanForm from './components/LoanForm';
import LoanHistory from './components/LoanHistory';
import InventoryLoader from './components/InventoryLoader';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const [requesters, setRequesters] = useState<string[]>(() => {
    try {
        const savedRequesters = localStorage.getItem('loanRequesters');
        return savedRequesters ? JSON.parse(savedRequesters) : [];
    } catch (error) {
        console.error('Failed to load requesters from localStorage', error);
        return [];
    }
  });

  const handleInventoryLoad = (loadedItems: Item[]) => {
    setItems(loadedItems);
    setIsDataLoaded(true);
  };

  const availableQuantities = useMemo(() => {
    const quantities: { [uniqueKey: string]: number } = {};
    items.forEach(item => {
        const loanedOut = loans
            .filter(l => l.item.uniqueKey === item.uniqueKey && l.status === LoanStatus.LOANED)
            .reduce((sum, l) => sum + l.loanedQuantity, 0);
        quantities[item.uniqueKey] = item.initialQuantity - loanedOut;
    });
    return quantities;
  }, [items, loans]);

  const handleBatchLoan = useCallback((
    loansToCreate: Omit<Loan, 'id' | 'loanTimestamp' | 'receiverSignature' | 'requesterName'>[],
    signature: string,
    requesterName: string
  ) => {
    const timestamp = new Date();
    const cleanRequesterName = requesterName.trim();
    const newLoans: Loan[] = loansToCreate.map(loanData => ({
      ...loanData,
      id: crypto.randomUUID(),
      loanTimestamp: timestamp,
      receiverSignature: signature,
      requesterName: cleanRequesterName,
    }));
    
    setLoans(prevLoans => [...newLoans, ...prevLoans]);

    if (cleanRequesterName && !requesters.includes(cleanRequesterName)) {
        const newRequesters = [...requesters, cleanRequesterName].sort();
        setRequesters(newRequesters);
        localStorage.setItem('loanRequesters', JSON.stringify(newRequesters));
    }

    if (window.innerWidth < 1024) {
      setActiveTab('history');
    }
  }, [requesters]);

  const handleBatchReturn = useCallback((loanIds: string[], returnerSignature: string) => {
    const returnTimestamp = new Date();
    setLoans(prevLoans =>
      prevLoans.map(loan =>
        loanIds.includes(loan.id)
          ? {
              ...loan,
              status: LoanStatus.RETURNED,
              returnTimestamp,
              returnerSignature,
            }
          : loan
      )
    );
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Gestor de Préstamos
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Administre el inventario y registre los préstamos de activos de forma fácil y segura.
          </p>
        </header>

        {!isDataLoaded ? (
            <InventoryLoader onLoad={handleInventoryLoad} />
        ) : (
          <>
            {/* Tab Navigation for mobile/tablet */}
            <div className="lg:hidden mb-4">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('form')}
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'form'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                    aria-current={activeTab === 'form' ? 'page' : undefined}
                  >
                    Registrar Préstamo
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'history'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }`}
                    aria-current={activeTab === 'history' ? 'page' : undefined}
                  >
                    Historial
                  </button>
                </nav>
              </div>
            </div>

            <main>
              {/* Mobile/Tablet View (Tab content) */}
              <div className="block lg:hidden">
                {activeTab === 'form' && <LoanForm items={items} onBatchLoan={handleBatchLoan} availableQuantities={availableQuantities} requesters={requesters} />}
                {activeTab === 'history' && <LoanHistory loans={loans} onBatchReturn={handleBatchReturn} />}
              </div>
              
              {/* Desktop View (Grid) */}
              <div className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                  <LoanForm items={items} onBatchLoan={handleBatchLoan} availableQuantities={availableQuantities} requesters={requesters} />
                </div>
                <div className="lg:col-span-3">
                  <LoanHistory loans={loans} onBatchReturn={handleBatchReturn} />
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
