import React, { useState, useEffect } from 'react';
import { Post, Comment } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotifications } from './hooks/useNotifications';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import NotificationPanel from './components/NotificationPanel';
import Search from './components/Search';
import Profile from './components/Profile';

const CURRENT_USER_ID = 'current-user';

function App() {
  const [posts, setPosts] = useLocalStorage<Post[]>('wupy-posts', []);
  const [activeTab, setActiveTab] = useState('home');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    notifications,
    showNotifications,
    setShowNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mock initial posts if none exist
  useEffect(() => {
    if (posts.length === 0) {
      const mockPosts: Post[] = [
        {
          id: '1',
          userId: 'user1',
          username: 'photographer_pro',
          userAvatar: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=400',
          content: '¡Hermoso atardecer desde mi ventana! 🌅✨ La naturaleza nunca deja de sorprenderme.',
          image: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=800',
          timestamp: new Date(Date.now() - 3600000),
          likes: 24,
          likedBy: ['user2', 'user3'],
          comments: [
            {
              id: 'c1',
              userId: 'user2',
              username: 'travel_blogger',
              userAvatar: 'https://images.pexels.com/photos/1036627/pexels-photo-1036627.jpeg?auto=compress&cs=tinysrgb&w=400',
              content: '¡Qué foto tan increíble! Me encanta la composición.',
              timestamp: new Date(Date.now() - 3000000),
              likes: 3,
              likedBy: ['user1'],
            }
          ],
          shares: 5,
        },
        {
          id: '2',
          userId: 'user2',
          username: 'travel_blogger',
          userAvatar: 'https://images.pexels.com/photos/1036627/pexels-photo-1036627.jpeg?auto=compress&cs=tinysrgb&w=400',
          content: 'Explorando nuevos lugares y conociendo culturas increíbles. La vida es una aventura constante 🌍',
          timestamp: new Date(Date.now() - 7200000),
          likes: 18,
          likedBy: ['user1'],
          comments: [],
          shares: 3,
        }
      ];
      setPosts(mockPosts);
    }
  }, [posts.length, setPosts]);

  const handleCreatePost = (content: string, image?: string) => {
    const newPost: Post = {
      id: Date.now().toString(),
      userId: CURRENT_USER_ID,
      username: 'Tu Usuario',
      userAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      content,
      image,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
    };

    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const isLiked = post.likedBy.includes(CURRENT_USER_ID);
          const newLikedBy = isLiked
            ? post.likedBy.filter(id => id !== CURRENT_USER_ID)
            : [...post.likedBy, CURRENT_USER_ID];

          // Add notification if we're liking someone else's post
          if (!isLiked && post.userId !== CURRENT_USER_ID) {
            addNotification({
              userId: post.userId,
              type: 'like',
              message: 'le gustó tu publicación',
              postId: postId,
              fromUserId: CURRENT_USER_ID,
              fromUsername: 'Tu Usuario',
              fromUserAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
            });
          }

          return {
            ...post,
            likes: newLikedBy.length,
            likedBy: newLikedBy,
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: CURRENT_USER_ID,
      username: 'Tu Usuario',
      userAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
      content,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
    };

    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          // Add notification if we're commenting on someone else's post
          if (post.userId !== CURRENT_USER_ID) {
            addNotification({
              userId: post.userId,
              type: 'comment',
              message: 'comentó tu publicación',
              postId: postId,
              fromUserId: CURRENT_USER_ID,
              fromUsername: 'Tu Usuario',
              fromUserAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
            });
          }

          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleTabChange = (tab: string) => {
    if (tab === 'create') {
      setShowCreatePost(true);
      return;
    }
    if (tab === 'notifications') {
      setShowNotifications(!showNotifications);
      return;
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return <Search />;
      case 'profile':
        return <Profile posts={posts} currentUserId={CURRENT_USER_ID} />;
      default:
        return (
          <Feed
            posts={posts}
            onLike={handleLike}
            onComment={handleComment}
            currentUserId={CURRENT_USER_ID}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        toggleSidebar={toggleSidebar}
        unreadNotifications={unreadCount}
        onNotificationsClick={() => setShowNotifications(!showNotifications)}
      />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        unreadNotifications={unreadCount}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <main className="pt-16 md:ml-20 lg:ml-64 transition-all duration-300">
        <div className="max-w-2xl mx-auto p-4">
          {renderContent()}
        </div>
      </main>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onSubmit={handleCreatePost}
          onClose={() => setShowCreatePost(false)}
        />
      )}

      {/* Notification Panel */}
      <NotificationPanel
        notifications={notifications}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
}

export default App;
