
import React from 'react';
import Layout from '../components/Layout';
import History from '../components/History';

const HistoryPage: React.FC = () => {
  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-ios-gray">Your past focus sessions</p>
      </header>
      
      <History />
    </Layout>
  );
};

export default HistoryPage;
