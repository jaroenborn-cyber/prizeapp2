const API_BASE = 'https://jouwdomain.com/api'; // TODO: Update met je Hostinger domein

export const saveNewsToBackend = async (newsItems) => {
  try {
    const response = await fetch(`${API_BASE}/news/save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newsItems)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to save news to backend:', error);
    throw error;
  }
};

export const getNewsArchive = async (filter = 'all', sort = 'date', limit = 1000, offset = 0) => {
  try {
    const url = `${API_BASE}/news/archive.php?filter=${filter}&sort=${sort}&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch archive from backend:', error);
    return [];
  }
};

export const getArchiveCount = async () => {
  try {
    const url = `${API_BASE}/news/archive.php?limit=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    return result.total || 0;
  } catch (error) {
    console.error('Failed to get archive count:', error);
    return 0;
  }
};

// Fallback: migrate existing localStorage data to backend
export const migrateLocalStorageToBackend = async () => {
  try {
    const localArchive = localStorage.getItem('crypto_news_archive');
    if (!localArchive) return { migrated: 0 };
    
    const data = JSON.parse(localArchive);
    if (!Array.isArray(data) || data.length === 0) return { migrated: 0 };
    
    const result = await saveNewsToBackend(data);
    
    // Clear localStorage after successful migration
    if (result.success) {
      localStorage.removeItem('crypto_news_archive');
      console.log(`Migrated ${result.saved} items from localStorage to backend`);
    }
    
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    return { migrated: 0, error: error.message };
  }
};
