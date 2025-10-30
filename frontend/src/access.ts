export default (initialState: { currentUser?: any }) => {
  const { currentUser } = initialState || {};
  
  return {
    canAdmin: currentUser && currentUser.role === 'admin',
  };
};