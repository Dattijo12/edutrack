import React, { createContext, useContext, useState, useEffect } from 'react';
import schoolService from '../services/schoolService';

/**
 * Context for storing and managing global school settings (name, logo, address, limits).
 */
const SchoolContext = createContext();

export const SchoolProvider = ({ children }) => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchoolSettings = async () => {
    try {
      const data = await schoolService.getSettings();
      setSchool(data);
    } catch (error) {
      console.error('Failed to fetch school settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  return (
    <SchoolContext.Provider value={{ school, setSchool, refreshSchool: fetchSchoolSettings, loading }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);
