import React from 'react';
import useAuth from '../../hooks/useAuth';
import RewardProgress from '../../components/user/RewardProgress';

const UserRewardProgress = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <RewardProgress userId={user?.id || user?._id} />
    </div>
  );
};

export default UserRewardProgress;
