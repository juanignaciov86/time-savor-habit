
import React from 'react';
import Layout from '../components/Layout';
import Stats from '../components/Stats';

const StatsPage: React.FC = () => {
  return (
    <Layout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-ios-gray">View your habit tracking progress</p>
      </header>
      
      <Stats />
    </Layout>
  );
};

export default StatsPage;
