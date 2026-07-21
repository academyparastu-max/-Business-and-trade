import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import QRCode from 'qrcode';
import { 
  Store, 
  Star, 
  MapPin, 
  Info, 
  QrCode, 
  Plus, 
  Download, 
  Printer, 
  ArrowRight, 
  MessageSquare, 
  Search, 
  CheckCircle2, 
  SlidersHorizontal, 
  User, 
  Calendar, 
  Sparkles,
  Copy, 
  TrendingUp,
  X,
  Trash2,
  Megaphone,
  Gift,
  Video,
  Upload,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shield,
  Users,
  Flag,
  AlertTriangle,
  Ban,
  Lock,
  Unlock,
  Sun,
  Moon
} from 'lucide-react';
import ShopMap from './components/ShopMap';

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  promotion?: string;
  promotionVideo?: string;
  owner?: string;
  lat?: number;
  lng?: number;
}

interface Review {
  id: string;
  shopId: string;
  rating: number;
  comment: string;
  customerName: string;
  username: string;
  createdAt: string;
  likes?: string[];
  reports?: {
    reporter: string;
    reason: string;
    createdAt: string;
  }[];
}

const PROMOTION_VIDEO_PRESETS = [
  {
    id: 'bakery',
    name: 'نان گرم و سنتی (Bakery Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-dough-being-kneaded-42218-large.mp4',
    keywords: ['نان', 'سنگک', 'بربری', 'تافتون', 'نانوایی', 'فانتزی', 'کنجد', 'خمیر', 'گندم']
  },
  {
    id: 'cafe',
    name: 'کافه و قهوه (Cafe Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-pouring-into-a-cup-34321-large.mp4',
    keywords: ['کافه', 'قهوه', 'شکلات', 'شیرینی', 'کیک', 'چای', 'دمنوش', 'اسپرسو', 'نسکافه', 'لاته']
  },
  {
    id: 'restaurant',
    name: 'رستوران و کباب (Restaurant Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-flambeing-food-in-a-pan-40540-large.mp4',
    keywords: ['رستوران', 'کباب', 'جوجه', 'خورشت', 'چلو', 'غذا', 'شام', 'ناهار', 'پلو']
  },
  {
    id: 'pizza',
    name: 'پیتزا و فست‌فود (Pizza Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-freshly-baked-pizza-with-stretching-cheese-42296-large.mp4',
    keywords: ['پیتزا', 'برگر', 'ساندویچ', 'فست', 'سیب زمینی', 'هات داگ', 'سوخاری']
  },
  {
    id: 'grocery',
    name: 'هایپرمارکت و میوه‌فروشی (Grocery Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-choosing-fresh-vegetables-in-a-grocery-store-42355-large.mp4',
    keywords: ['سوپرمارکت', 'هایپر', 'میوه', 'سبزی', 'خرید', 'فروشگاه', 'لبنیات', 'خواربار']
  },
  {
    id: 'storefront',
    name: 'پرداخت و ویترین عمومی (General Store Video)',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-paying-by-card-at-a-cash-register-42340-large.mp4',
    keywords: []
  }
];

const getShopPromotionVideo = (shop: Shop): string => {
  if (shop.promotionVideo) {
    if (shop.promotionVideo.startsWith('http') || shop.promotionVideo.startsWith('/uploads')) {
      return shop.promotionVideo;
    }
    const preset = PROMOTION_VIDEO_PRESETS.find(p => p.id === shop.promotionVideo);
    if (preset) return preset.url;
  }

  // Automatic smart keyword-based detection
  const textToSearch = `${shop.name} ${shop.description} ${shop.promotion || ''}`.toLowerCase();
  for (const preset of PROMOTION_VIDEO_PRESETS) {
    if (preset.keywords.length > 0) {
      const match = preset.keywords.some(keyword => textToSearch.includes(keyword));
      if (match) return preset.url;
    }
  }

  // Default storefront video
  return 'https://assets.mixkit.co/videos/preview/mixkit-paying-by-card-at-a-cash-register-42340-large.mp4';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-right font-sans text-xs space-y-1.5" dir="rtl">
        <p className="font-black text-amber-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="font-bold">{entry.name}:</span>
            <span className="font-black font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  // Global States
  const [shops, setShops] = useState<Record<string, Shop>>({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState<'customer' | 'shopkeeper' | 'admin'>('customer');
  const [currentShopId, setCurrentShopId] = useState<string>('');
  const [adminCount, setAdminCount] = useState<number>(0);

  // User Auth States
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName: string; role?: 'customer' | 'shopkeeper' | 'admin'; phoneNumber?: string; isMainAdmin?: boolean } | null>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authRole, setAuthRole] = useState<'customer' | 'shopkeeper' | 'admin'>('customer');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Admin States
  const [adminUsers, setAdminUsers] = useState<{ username: string; fullName: string; role: 'customer' | 'shopkeeper' | 'admin'; phoneNumber?: string; isBlocked?: boolean; isMainAdmin?: boolean }[]>([]);
  const [adminLoadingUsers, setAdminLoadingUsers] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string>('');
  const [adminSuccessMessage, setAdminSuccessMessage] = useState<string>('');
  const [newAdminToast, setNewAdminToast] = useState<boolean>(false);
  
  // Review Form States
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [customerComment, setCustomerComment] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Shop Registration Form States
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopId, setNewShopId] = useState<string>('');
  const [newShopAddress, setNewShopAddress] = useState<string>('');
  const [newShopDescription, setNewShopDescription] = useState<string>('');
  const [newShopPromotion, setNewShopPromotion] = useState<string>('');
  const [newShopPromotionVideo, setNewShopPromotionVideo] = useState<string>('storefront');
  const [editingPromotion, setEditingPromotion] = useState<string>('');
  const [editingPromotionVideo, setEditingPromotionVideo] = useState<string>('storefront');
  const [tempLat, setTempLat] = useState<number | undefined>(undefined);
  const [tempLng, setTempLng] = useState<number | undefined>(undefined);
  const [registerShopLat, setRegisterShopLat] = useState<number | undefined>(undefined);
  const [registerShopLng, setRegisterShopLng] = useState<number | undefined>(undefined);
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  const [submittingShop, setSubmittingShop] = useState<boolean>(false);
  const [showAddShopModal, setShowAddShopModal] = useState<boolean>(false);

  // UI Utilities
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shopkeeperSelectedShopId, setShopkeeperSelectedShopId] = useState<string>('');
  const [reviewFilter, setReviewFilter] = useState<number>(0); // 0 = all ratings
  const [customerReviewFilter, setCustomerReviewFilter] = useState<number>(0); // 0 = all ratings
  const [expandedShopReviews, setExpandedShopReviews] = useState<Record<string, boolean>>({});
  const [chartTimeframe, setChartTimeframe] = useState<7 | 30>(7);
  const [customerChartTimeframe, setCustomerChartTimeframe] = useState<7 | 30>(7);
  
  // AI summary states
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [authPhoneNumber, setAuthPhoneNumber] = useState<string>('');

  // Main Admin Creating Admin states
  const [showAddAdminForm, setShowAddAdminForm] = useState<boolean>(false);
  const [newAdminUsername, setNewAdminUsername] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [newAdminFullName, setNewAdminFullName] = useState<string>('');
  const [newAdminPhone, setNewAdminPhone] = useState<string>('');
  const [addAdminError, setAddAdminError] = useState<string>('');
  const [addAdminSuccess, setAddAdminSuccess] = useState<string>('');
  const [addAdminLoading, setAddAdminLoading] = useState<boolean>(false);

  // Flag / Report Review States
  const [reportingReviewId, setReportingReviewId] = useState<string>('');
  const [reportingReason, setReportingReason] = useState<string>('');
  const [reportingError, setReportingError] = useState<string>('');
  const [reportingSuccess, setReportingSuccess] = useState<string>('');
  const [reportingLoading, setReportingLoading] = useState<boolean>(false);
  const [adminOnlyShowReported, setAdminOnlyShowReported] = useState<boolean>(false);

  // 2FA / Verification States
  const [verificationPendingUser, setVerificationPendingUser] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationInput, setVerificationInput] = useState<string>('');
  const [verificationTimer, setVerificationTimer] = useState<number>(0);
  const [isVerificationActive, setIsVerificationActive] = useState<boolean>(false);
  const [smsNotificationVisible, setSmsNotificationVisible] = useState<boolean>(false);

  // Fetch initial database data from fullstack API
  const fetchDatabaseData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || {});
        setReviews(data.reviews || []);
        if (data.adminCount !== undefined) {
          setAdminCount(data.adminCount);
        }
        
        // If there are shops and no shopkeeper selected shop, default to first one
        const shopKeys = Object.keys(data.shops || {});
        if (shopKeys.length > 0 && !shopkeeperSelectedShopId) {
          setShopkeeperSelectedShopId(shopKeys[0]);
        }
      }
    } catch (err) {
      console.error('خطا در دریافت اطلاعات از سرور:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditingForm: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('لطفاً فقط فایل ویدیویی انتخاب کنید.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('اندازه فایل ویدیو نباید بیشتر از ۵۰ مگابایت باشد.');
      return;
    }

    setUploadingVideo(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const targetShopId = isEditingForm ? shopkeeperSelectedShopId : newShopId;
          
          const res = await fetch('/api/upload-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoData: base64Data, shopId: targetShopId || 'temp' })
          });
          
          const data = await res.json();
          if (res.ok && data.url) {
            if (isEditingForm) {
              setEditingPromotionVideo(data.url);
            } else {
              setNewShopPromotionVideo(data.url);
            }
          } else {
            setUploadError(data.error || 'خطا در بارگذاری ویدیو');
          }
        } catch (err) {
          setUploadError('خطای ارتباط با سرور هنگام بارگذاری');
        } finally {
          setUploadingVideo(false);
        }
      };
      reader.onerror = () => {
        setUploadError('خطا در خواندن فایل ویدیویی');
        setUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('خطای غیرمنتظره در بارگذاری');
      setUploadingVideo(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  // Parse URL query parameter `?shop=XYZ` to direct client to specified shop
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    if (shopParam) {
      setCurrentShopId(shopParam);
      setActiveTab('customer');
    }
  }, [shops]);

  // 2FA Timer Countdown Hook
  useEffect(() => {
    let timerId: any;
    if (isVerificationActive && verificationTimer > 0) {
      timerId = setInterval(() => {
        setVerificationTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            // Handle timeout on next tick
            setTimeout(() => {
              handleVerificationTimeout();
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isVerificationActive, verificationTimer]);

  const handleVerificationTimeout = () => {
    alert('مهلت ۲ دقیقه‌ای شما برای وارد کردن کد تایید به پایان رسید و به صفحه نخست منتقل شدید.');
    setIsVerificationActive(false);
    setVerificationPendingUser(null);
    setVerificationCode('');
    setVerificationInput('');
    setVerificationTimer(0);
    setSmsNotificationVisible(false);
    
    // Redirect to "صفحه اول"
    setCurrentShopId('');
    setActiveTab('customer');
  };

  const sendSimulatedSMS = (code: string, phone: string) => {
    setVerificationCode(code);
    setVerificationTimer(120); // 2 minutes (120 seconds)
    setIsVerificationActive(true);
    setSmsNotificationVisible(true);
  };

  const handleResendCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const phone = verificationPendingUser?.phoneNumber || authPhoneNumber || '۰۹*********';
    sendSimulatedSMS(newCode, phone);
    setVerificationInput('');
    alert(`کد تایید جدید شبیه‌سازی شد و به شماره ${phone} پیامک شد.`);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationInput.trim() === verificationCode) {
      setCurrentUser(verificationPendingUser);
      localStorage.setItem('currentUser', JSON.stringify(verificationPendingUser));
      
      // Clear verification state
      setIsVerificationActive(false);
      setVerificationPendingUser(null);
      setVerificationCode('');
      setVerificationInput('');
      setSmsNotificationVisible(false);
      
      // Clear login form fields
      setAuthUsername('');
      setAuthPassword('');
      setAuthPhoneNumber('');
      setAuthError('');
    } else {
      alert('کد وارد شده صحیح نیست. لطفا مجدداً تلاش کنید.');
    }
  };

  // Generate QR Code whenever selected shop changes in shopkeeper dashboard
  useEffect(() => {
    if (shopkeeperSelectedShopId) {
      const shopUrl = `${window.location.origin}?shop=${shopkeeperSelectedShopId}`;
      QRCode.toDataURL(shopUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('خطا در تولید کد QR:', err));
    }
  }, [shopkeeperSelectedShopId]);

  // Synchronize editingPromotion and editingPromotionVideo state with the selected shop's current promotion
  useEffect(() => {
    if (shopkeeperSelectedShopId && shops[shopkeeperSelectedShopId]) {
      setEditingPromotion(shops[shopkeeperSelectedShopId].promotion || '');
      setEditingPromotionVideo(shops[shopkeeperSelectedShopId].promotionVideo || 'storefront');
    } else {
      setEditingPromotion('');
      setEditingPromotionVideo('storefront');
    }
  }, [shopkeeperSelectedShopId, shops]);

  // Fetch AI review summary
  const fetchAiSummary = async (shopId: string) => {
    if (!shopId) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/ai-summary`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'خطا در دریافت تحلیل هوشمند از سرور');
      }
      const data = await res.json();
      setAiSummary(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'خطا در ارتباط با سرور جهت دریافت تحلیل نظرات.');
      setAiSummary(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch AI summary when shopkeeper changes selected shop or when reviews array updates
  useEffect(() => {
    if (shopkeeperSelectedShopId) {
      fetchAiSummary(shopkeeperSelectedShopId);
    } else {
      setAiSummary(null);
    }
  }, [shopkeeperSelectedShopId]);

  // Synchronize authRole and clear errors based on active tab
  useEffect(() => {
    if (activeTab === 'customer') {
      setAuthRole('customer');
    } else if (activeTab === 'shopkeeper') {
      setAuthRole('shopkeeper');
    } else if (activeTab === 'admin') {
      setAuthRole('admin');
      if (adminCount >= 1) {
        setAuthTab('login');
      }
    }
    setAuthError('');
  }, [activeTab, adminCount]);

  const fetchAdminUsers = async () => {
    try {
      setAdminLoadingUsers(true);
      const res = await fetch(`/api/users?requesterRole=admin`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminUsers(data.users);
      } else {
        setAdminError(data.error || 'خطا در دریافت لیست کاربران');
      }
    } catch {
      setAdminError('خطا در برقراری ارتباط با سرور');
    } finally {
      setAdminLoadingUsers(false);
    }
  };

  const handleAdminToggleBlockUser = async (username: string, currentlyBlocked: boolean) => {
    const actionText = currentlyBlocked ? 'رفع مسدودیت' : 'مسدود کردن';
    if (!window.confirm(`آیا از ${actionText} کاربر "${username}" اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/users/${username}/toggle-block?requesterRole=admin&requesterUsername=${encodeURIComponent(currentUser?.username || '')}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMessage(`وضعیت کاربر با موفقیت تغییر کرد (کاربر ${data.isBlocked ? 'مسدود' : 'فعال'} شد)`);
        fetchAdminUsers();
        fetchDatabaseData();
        setTimeout(() => setAdminSuccessMessage(''), 3000);
      } else {
        setAdminError(data.error || 'خطا در تغییر وضعیت کاربر');
      }
    } catch {
      setAdminError('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleAdminDeleteReview = async (reviewId: string) => {
    if (!window.confirm('آیا از حذف این نظر اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}?requesterRole=admin`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMessage('نظر با موفقیت حذف شد');
        fetchDatabaseData();
        setTimeout(() => setAdminSuccessMessage(''), 3000);
      } else {
        setAdminError(data.error || 'خطا در حذف نظر');
      }
    } catch {
      setAdminError('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleAdminDeleteShop = async (shopId: string) => {
    if (!window.confirm('آیا از حذف این مغازه و تمامی نظرات مربوط به آن اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}?requesterRole=admin`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMessage('مغازه با موفقیت حذف شد');
        fetchDatabaseData();
        setTimeout(() => setAdminSuccessMessage(''), 3000);
      } else {
        setAdminError(data.error || 'خطا در حذف مغازه');
      }
    } catch {
      setAdminError('خطا در برقراری ارتباط با سرور');
    }
  };

  const handleAdminPromoteUser = async (username: string) => {
    if (!window.confirm(`آیا از ارتقای کاربر @${username} به ادمین اطمینان دارید؟`)) {
      return;
    }
    try {
      setAdminError('');
      setAdminSuccessMessage('');
      const res = await fetch(`/api/users/${username}/promote?requesterRole=admin&requesterUsername=${encodeURIComponent(currentUser?.username || '')}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccessMessage(`کاربر @${username} با موفقیت به عنوان مدیر (ادمین) سیستم ارتقا یافت.`);
        setTimeout(() => setAdminSuccessMessage(''), 4000);
        // Refresh users list
        fetchAdminUsers();
      } else {
        setAdminError(data.error || 'خطا در ارتقای کاربر');
        setTimeout(() => setAdminError(''), 4000);
      }
    } catch {
      setAdminError('خطا در برقراری ارتباط با سرور');
      setTimeout(() => setAdminError(''), 4000);
    }
  };

  const handleCreateNewAdminByMainAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError('');
    setAddAdminSuccess('');

    if (!newAdminUsername.trim() || !newAdminPassword.trim() || !newAdminFullName.trim() || !newAdminPhone.trim()) {
      setAddAdminError('پر کردن تمامی فیلدها الزامی است');
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(newAdminPhone.trim())) {
      setAddAdminError('شماره تلفن همراه معتبر نیست (باید ۱۱ رقم باشد و با ۰۹ شروع شود)');
      return;
    }

    try {
      setAddAdminLoading(true);
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newAdminUsername.trim(),
          password: newAdminPassword.trim(),
          fullName: newAdminFullName.trim(),
          role: 'admin',
          phoneNumber: newAdminPhone.trim(),
          requesterUsername: currentUser?.username
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAddAdminSuccess(`ادمین جدید با موفقیت ایجاد شد.`);
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminFullName('');
        setNewAdminPhone('');
        fetchAdminUsers();
        fetchDatabaseData();
      } else {
        setAddAdminError(data.error || 'خطا در ثبت‌نام ادمین جدید');
      }
    } catch (err) {
      console.error(err);
      setAddAdminError('خطا در برقراری ارتباط با سرور');
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Periodically check if the current user got promoted to admin, demoted, or deleted
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/users/status?username=${encodeURIComponent(currentUser.username)}`);
        if (res.status === 404) {
          // User was deleted!
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
          alert('حساب کاربری شما توسط ادمین سیستم حذف شده است.');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (data.isBlocked) {
            setCurrentUser(null);
            localStorage.removeItem('currentUser');
            alert('حساب کاربری شما توسط ادمین سیستم مسدود شده است.');
            return;
          }
          // Check if role or main admin status changed
          if (data.role !== currentUser.role || data.isMainAdmin !== currentUser.isMainAdmin) {
            const updatedUser = { 
              ...currentUser, 
              role: data.role as any, 
              isMainAdmin: data.isMainAdmin 
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            if (data.role === 'admin' && currentUser.role !== 'admin') {
              setNewAdminToast(true);
            }
          }
        }
      } catch (e) {
        // Quietly ignore background network/server-restart failures
      }
    };

    // Check once immediately, then check every 7 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 7000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Fetch admin users when entering the admin tab
  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.role === 'admin') {
      fetchAdminUsers();
    }
  }, [activeTab, currentUser]);

  // Sync selected shop map coordinates with state
  useEffect(() => {
    const selectedShop = shops[shopkeeperSelectedShopId];
    if (selectedShop) {
      setTempLat(selectedShop.lat);
      setTempLng(selectedShop.lng);
    } else {
      setTempLat(undefined);
      setTempLng(undefined);
    }
  }, [shopkeeperSelectedShopId, shops]);

  // Auth Form Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    if (authRole === 'shopkeeper') {
      if (!authPhoneNumber.trim()) {
        setAuthError('وارد کردن شماره تلفن الزامی است');
        return;
      }
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(authPhoneNumber.trim())) {
        setAuthError('شماره تلفن وارد شده معتبر نیست. باید با ۰۹ شروع شده و ۱۱ رقم باشد.');
        return;
      }
    }

    try {
      setAuthLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          role: authRole,
          phoneNumber: authRole === 'shopkeeper' ? authPhoneNumber.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        // Clear fields
        setAuthUsername('');
        setAuthPassword('');
        setAuthPhoneNumber('');
      } else {
        setAuthError(data.error || 'نام کاربری یا رمز عبور اشتباه است');
      }
    } catch (err) {
      console.error(err);
      setAuthError('خطا در برقراری ارتباط با سرور');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim() || !authFullName.trim() || !authPhoneNumber.trim()) {
      setAuthError('پر کردن تمامی فیلدها الزامی است');
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(authPhoneNumber.trim())) {
      setAuthError('شماره تلفن همراه وارد شده معتبر نیست. باید با ۰۹ شروع شده و ۱۱ رقم باشد.');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword.trim(),
          fullName: authFullName,
          role: authRole,
          phoneNumber: authPhoneNumber.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === 'customer' || data.user.role === 'shopkeeper') {
          setVerificationPendingUser(data.user);
          const phone = data.user.phoneNumber || authPhoneNumber.trim() || '۰۹*********';
          const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
          sendSimulatedSMS(randomCode, phone);
        } else {
          setCurrentUser(data.user);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          // Clear fields
          setAuthUsername('');
          setAuthPassword('');
          setAuthFullName('');
          setAuthPhoneNumber('');
        }
      } else {
        setAuthError(data.error || 'این نام کاربری قبلاً ثبت شده است');
      }
    } catch (err) {
      console.error(err);
      setAuthError('خطا در برقراری ارتباط با سرور');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Submit Feedback Handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId || !currentUser) return;

    try {
      setSubmittingReview(true);
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: currentShopId,
          rating: customerRating,
          comment: customerComment,
          username: currentUser.username
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Clear form
        setCustomerComment('');
        setCustomerRating(5);
        // Refresh server data
        await fetchDatabaseData();
      } else {
        const errData = await response.json();
        alert(errData.error || 'خطایی در ثبت بازخورد رخ داد');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit Shop Registration Handler
  const handleShopRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(shops).length >= 1) {
      alert('سیستم به ثبت تنها یک مغازه محدود شده است. برای ثبت مغازه جدید، ابتدا مغازه قبلی را حذف کنید.');
      return;
    }

    if (!newShopName.trim() || !newShopId.trim()) {
      alert('نام مغازه و کد دلخواه مغازه الزامی هستند');
      return;
    }

    const formattedId = newShopId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!formattedId) {
      alert('کد مغازه باید شامل حروف انگلیسی یا اعداد باشد');
      return;
    }

    try {
      setSubmittingShop(true);
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formattedId,
          name: newShopName.trim(),
          address: newShopAddress.trim(),
          description: newShopDescription.trim(),
          promotion: newShopPromotion.trim(),
          promotionVideo: newShopPromotionVideo,
          owner: currentUser?.username || '',
          lat: registerShopLat,
          lng: registerShopLng
        }),
      });

      if (response.ok) {
        setRegisterSuccess(true);
        setNewShopName('');
        setNewShopId('');
        setNewShopAddress('');
        setNewShopDescription('');
        setNewShopPromotion('');
        setNewShopPromotionVideo('storefront');
        setRegisterShopLat(undefined);
        setRegisterShopLng(undefined);
        setShopkeeperSelectedShopId(formattedId);
        
        await fetchDatabaseData();
        
        // Auto close modal after brief delay
        setTimeout(() => {
          setRegisterSuccess(false);
          setShowAddShopModal(false);
        }, 2000);
      } else {
        const errData = await response.json();
        alert(errData.error || 'خطایی در ثبت مغازه جدید رخ داد');
      }
    } catch (err) {
      console.error('Error registering shop:', err);
      alert('خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmittingShop(false);
    }
  };

  const handleSaveMapLocation = async () => {
    if (!selectedShopObj) return;
    try {
      const res = await fetch(`/api/shops/${selectedShopObj.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: tempLat,
          lng: tempLng,
          ownerUsername: currentUser?.username || ''
        })
      });
      if (res.ok) {
        await fetchDatabaseData();
        alert('موقعیت جغرافیایی مغازه روی نقشه با موفقیت ذخیره شد!');
      } else {
        const errData = await res.json();
        alert(errData.error || 'خطا در ذخیره موقعیت روی نقشه');
      }
    } catch (e) {
      console.error(e);
      alert('خطا در ارتباط با سرور');
    }
  };

  // Select another shop in Customer view (returns to shop picker)
  const handleExitShopView = () => {
    // Remove query param from browser URL to clear history
    const url = new URL(window.location.href);
    url.searchParams.delete('shop');
    window.history.pushState({}, '', url.toString());
    setCurrentShopId('');
    setSubmitSuccess(false);
  };

  // Helper: Format relative Persian time
  const formatPersianDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'همین الان';
      if (diffMins < 60) return `${diffMins} دقیقه پیش`;
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      if (diffDays < 7) return `${diffDays} روز پیش`;

      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'به تازگی';
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!currentUser) {
      alert('برای لایک کردن نظرات ابتدا باید وارد حساب کاربری خود شوید.');
      // Scroll to the auth container
      const authContainer = document.getElementById('auth-section-anchor');
      if (authContainer) {
        authContainer.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
        }),
      });

      if (response.ok) {
        await fetchDatabaseData();
      } else {
        const errData = await response.json();
        alert(errData.error || 'خطایی در ثبت لایک رخ داد');
      }
    } catch (err) {
      console.error('Error liking review:', err);
      alert('خطا در ارتباط با سرور');
    }
  };

  const handleReportReview = async (reviewId: string, reason: string) => {
    if (!currentUser) {
      alert('برای گزارش تخلف ابتدا باید وارد حساب کاربری خود شوید.');
      // Scroll to the auth container
      const authContainer = document.getElementById('auth-section-anchor');
      if (authContainer) {
        authContainer.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (!reason || !reason.trim()) {
      alert('لطفا علت گزارش را وارد کنید.');
      return;
    }

    try {
      setReportingLoading(true);
      setReportingError('');
      setReportingSuccess('');

      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: currentUser.username,
          reason: reason.trim()
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        setReportingSuccess('گزارش شما با موفقیت ثبت شد و جهت بررسی به مدیر سیستم ارسال گردید.');
        setReportingReason('');
        await fetchDatabaseData();
        setTimeout(() => {
          setReportingReviewId('');
          setReportingSuccess('');
        }, 3000);
      } else {
        setReportingError(resData.error || 'خطایی در ثبت گزارش رخ داد');
      }
    } catch (err) {
      console.error('Error reporting review:', err);
      setReportingError('خطا در ارتباط با سرور');
    } finally {
      setReportingLoading(false);
    }
  };

  const handleDismissReports = async (reviewId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('فقط مدیران سیستم به این بخش دسترسی دارند.');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}/dismiss-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterRole: 'admin'
        }),
      });

      if (response.ok) {
        alert('گزارش‌های تخلف این نظر با موفقیت رد شد.');
        await fetchDatabaseData();
      } else {
        const errData = await response.json();
        alert(errData.error || 'خطایی در رد گزارش رخ داد');
      }
    } catch (err) {
      console.error('Error dismissing reports:', err);
      alert('خطا در ارتباط با سرور');
    }
  };

  // Calculations for currently viewed shop in customer mode
  const currentShop = shops[currentShopId];
  const currentShopReviews = reviews.filter(r => r.shopId === currentShopId);
  const currentShopAvgRating = currentShopReviews.length > 0
    ? (currentShopReviews.reduce((sum, r) => sum + r.rating, 0) / currentShopReviews.length).toFixed(1)
    : '0.0';

  const customerFilteredReviews = currentShopReviews.filter(r => 
    customerReviewFilter === 0 || r.rating === customerReviewFilter
  );

  // Stars count breakdown for ratings panel
  const getRatingBreakdown = (ratingValue: number) => {
    if (currentShopReviews.length === 0) return 0;
    const count = currentShopReviews.filter(r => r.rating === ratingValue).length;
    return Math.round((count / currentShopReviews.length) * 100);
  };

  // Filtered shops list for search in customer welcome screen
  const filteredShopsList = (Object.values(shops) as Shop[]).filter(shop => 
    (shop.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.address || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Shopkeeper specific calculations
  const selectedShopObj = shops[shopkeeperSelectedShopId];
  const isShopOwner = selectedShopObj ? (!selectedShopObj.owner || selectedShopObj.owner === currentUser?.username) : false;
  const selectedShopReviews = reviews.filter(r => r.shopId === shopkeeperSelectedShopId);
  const selectedShopAvgRating = selectedShopReviews.length > 0
    ? (selectedShopReviews.reduce((sum, r) => sum + r.rating, 0) / selectedShopReviews.length).toFixed(1)
    : '0.0';

  const shopkeeperFilteredReviews = selectedShopReviews.filter(r => 
    reviewFilter === 0 || r.rating === reviewFilter
  );

  const getChartData = (daysCount: number, reviewsList: Review[]) => {
    const data = [];
    const now = new Date();
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const label = d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      
      const dayReviews = reviewsList.filter(r => {
        try {
          const rDate = new Date(r.createdAt).toISOString().split('T')[0];
          return rDate === dateStr;
        } catch (e) {
          return false;
        }
      });
      
      const cumulativeReviews = reviewsList.filter(r => {
        try {
          const rDate = new Date(r.createdAt).toISOString().split('T')[0];
          return rDate <= dateStr;
        } catch (e) {
          return false;
        }
      });
      
      const dayAvg = dayReviews.length > 0 
        ? Number((dayReviews.reduce((sum, r) => sum + r.rating, 0) / dayReviews.length).toFixed(1))
        : 0;
        
      const cumulativeAvg = cumulativeReviews.length > 0
        ? Number((cumulativeReviews.reduce((sum, r) => sum + r.rating, 0) / cumulativeReviews.length).toFixed(1))
        : 0;

      data.push({
        dateStr,
        label,
        'تعداد نظرات': dayReviews.length,
        'میانگین امتیاز': dayAvg,
        'روند کل امتیاز': cumulativeAvg || undefined,
      });
    }
    return data;
  };

  // Handler to download QR Code as PNG image
  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !selectedShopObj) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-${selectedShopObj.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* MOCK SMS NOTIFICATION */}
      {smsNotificationVisible && verificationCode && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl text-white animate-slideDown relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black text-slate-300">پیامک جدید (شبیه‌ساز سیستم)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-mono">الآن</span>
                <button 
                  onClick={() => setSmsNotificationVisible(false)}
                  className="p-1 hover:bg-slate-800 rounded-md transition text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <p className="text-xs text-slate-100 font-bold leading-relaxed">
                مشتری گرامی، کد تایید هویت دو مرحله‌ای شما در سیستم «کار و کاسبی» عبارت است از:
              </p>
              <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 gap-4">
                <span className="text-lg font-black tracking-[0.25em] text-amber-400 font-mono select-all">{verificationCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(verificationCode);
                    alert('کد تایید با موفقیت کپی شد!');
                  }}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  کپی کد
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-slate-400 font-semibold leading-none">
                  ⏱️ مهلت استفاده: ۲ دقیقه (۱۲۰ ثانیه)
                </p>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">ارسال شد</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. MAIN GLOBAL HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 z-40 print:hidden shadow-xs transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <QrCode className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight transition-colors">کار و کاسبی</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors">سیستم امتیازدهی یکپارچه و آنی مغازه‌ها</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* High-Contrast Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-transparent dark:border-slate-700 transition-colors active:scale-95 cursor-pointer flex items-center justify-center shadow-xs shrink-0"
              title={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره با تباین بالا'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* User status & Logout in header */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-3 py-1.5 rounded-xl transition-colors">
                <div className="w-6.5 h-6.5 rounded-lg bg-amber-500 text-white flex items-center justify-center font-extrabold text-xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-none font-medium">خوش آمدید</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight block mt-0.5 transition-colors">
                    {currentUser.fullName}
                    {currentUser.phoneNumber && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5 font-mono" dir="ltr">
                        {currentUser.phoneNumber}
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-amber-700 hover:text-red-600 font-black border-r border-amber-200 pr-2.5 mr-1.5 transition cursor-pointer"
                >
                  خروج
                </button>
              </div>
            )}

            {/* Navigation Tabs (Toggle Customer / Shopkeeper view) */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 transition-colors">
            <button
              onClick={() => {
                setActiveTab('customer');
                // If exiting shopkeeper, and URL didn't have shop, reset shop view
                const params = new URLSearchParams(window.location.search);
                if (!params.get('shop')) {
                  setCurrentShopId('');
                }
              }}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              بخش خریداران (ثبت نظر)
            </button>
            <button
              onClick={() => setActiveTab('shopkeeper')}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'shopkeeper'
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              پنل مغازه‌داران (کد QR)
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              پنل ادمین (مدیریت)
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* 2. LOADING SCREEN */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium text-sm">در حال بارگذاری اطلاعات مغازه‌ها...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 md:py-10 print:p-0">

          {/* ========================================================= */}
          {/* ==================== A. CUSTOMER TAB ==================== */}
          {/* ========================================================= */}
          {activeTab === 'customer' && (
            <div className="print:hidden">
              
              {/* Case A1: No Shop Selected (Show searchable shop list/welcome) */}
              {!currentShopId ? (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Big Greeting Hero */}
                  <div className="text-center max-w-2xl mx-auto space-y-3.5 py-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full text-amber-800 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      نظر شما به بهبود خدمات کمک می‌کند
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">به مغازه‌های محله خود امتیاز دهید!</h2>
                    <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                      با اسکن کد QR نصب شده روی دیوار هر مغازه، مستقیماً وارد صفحه اختصاصی آن شده و امتیاز و نظر خود را ثبت کنید. همچنین می‌توانید نام مغازه را در کادر زیر جستجو کنید.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="max-w-md mx-auto relative">
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="جستجوی نام مغازه، صنف یا آدرس..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-11 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm transition-all duration-200"
                    />
                  </div>

                  {/* Shops Directory (Full Width) */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base md:text-lg flex items-center gap-2">
                        <Store className="w-5 h-5 text-amber-500" />
                        مغازه‌های ثبت شده در سیستم ({filteredShopsList.length})
                      </h3>
                      <button 
                        onClick={() => setActiveTab('shopkeeper')} 
                        className="text-amber-600 hover:text-amber-700 font-bold text-xs flex items-center gap-1 transition"
                      >
                        مغازه شما اینجا نیست؟ ثبت رایگان مغازه
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>

                    {filteredShopsList.length === 0 ? (
                      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
                        <Store className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
                        <p className="font-bold text-sm">مغازه‌ای با این نام یا آدرس پیدا نشد.</p>
                        <p className="text-xs mt-1 opacity-70">می‌توانید در پنل مغازه‌داران یک مغازه جدید ثبت کنید!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {filteredShopsList.map((shop) => {
                          const shopReviewsList = reviews.filter(r => r.shopId === shop.id);
                          const avgRating = shopReviewsList.length > 0
                            ? (shopReviewsList.reduce((sum, r) => sum + r.rating, 0) / shopReviewsList.length).toFixed(1)
                            : 'بدون امتیاز';

                          return (
                            <div
                              key={shop.id}
                              onClick={() => {
                                  setCurrentShopId(shop.id);
                                  // Set URL query parameter nicely without reload
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('shop', shop.id);
                                  window.history.pushState({}, '', url.toString());
                                }}
                              className="bg-white border border-slate-100 hover:border-amber-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[11.5rem]"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="bg-amber-50 text-amber-700 w-9 h-9 rounded-lg flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                    <Store className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black text-slate-700">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{avgRating}</span>
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <h4 className="font-black text-slate-900 group-hover:text-amber-600 transition duration-150 text-sm truncate">{shop.name}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">{shop.description || 'بدون توضیح کوتاه'}</p>
                                </div>

                                {shop.promotion && (
                                  <div className="mt-1 flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-100/70 text-[9px] font-black py-1 px-2.5 rounded-lg truncate">
                                    <Megaphone className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="truncate">{shop.promotion}</span>
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-slate-50 pt-2.5 mt-3 flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{shop.address || 'ثبت نشده'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                
                // Case A2: Shop Selected (Show feedback form and reviews)
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Exit Shop and Return to List */}
                  <div>
                    <button
                      onClick={handleExitShopView}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      مشاهده همه مغازه‌ها
                    </button>
                  </div>

                  {/* Shop Details Header Card */}
                  {currentShop && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <Store className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">{currentShop.name}</h2>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">صفحه ثبت نظرات و امتیازدهی</p>
                          </div>
                        </div>

                        {currentShop.description && (
                          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-xl">
                            {currentShop.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{currentShop.address || 'آدرسی برای این مغازه ثبت نشده است.'}</span>
                        </div>
                      </div>

                      {/* Summary score bubble */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center md:min-w-44 self-start md:self-auto">
                        <span className="text-slate-400 text-xs font-black mb-1">میانگین امتیازات</span>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl md:text-4xl font-black text-slate-900">{currentShopAvgRating}</span>
                          <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                        </div>
                        <span className="text-xs text-slate-500 font-bold mt-1.5">از مجموع {currentShopReviews.length} رأی</span>
                      </div>
                    </div>
                  )}

                  {/* Interactive Map Section */}
                  {currentShop && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-slate-900 text-xs md:text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          موقعیت مغازه روی نقشه
                        </h3>
                        {currentShop.address && (
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 truncate max-w-xs md:max-w-md">
                            آدرس: {currentShop.address}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-[260px] rounded-2xl overflow-hidden relative border border-slate-100">
                        <ShopMap 
                          address={currentShop.address || ''} 
                          lat={currentShop.lat} 
                          lng={currentShop.lng} 
                          shopName={currentShop.name}
                          readOnly={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Shop Advertisement / Promotion Banner */}
                  {currentShop && currentShop.promotion && (
                    <div className="bg-white border-2 border-amber-500/25 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 animate-fadeIn grid grid-cols-1 md:grid-cols-12">
                      
                      {/* Promo Video on the Left/Right */}
                      <div className="md:col-span-4 h-64 md:h-full relative min-h-[180px] bg-slate-900 overflow-hidden flex items-center justify-center">
                        <video 
                          key={currentShop.promotionVideo || 'default'}
                          src={getShopPromotionVideo(currentShop)} 
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          controls
                        />
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 pointer-events-none z-10">
                          <Gift className="w-3.5 h-3.5 animate-bounce" />
                          <span>ویدیو تبلیغاتی فعال</span>
                        </div>
                      </div>

                      {/* Promo Details */}
                      <div className="md:col-span-8 p-5 md:p-6 flex flex-col justify-center gap-3 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 relative">
                        {/* Decorative subtle background icon */}
                        <Megaphone className="absolute -left-4 -bottom-4 w-32 h-32 text-amber-500/5 transform -rotate-12 pointer-events-none" />

                        <div className="space-y-1.5 relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs text-amber-800 font-black bg-amber-100/80 px-2.5 py-0.5 rounded-full inline-block">
                              تبلیغات و آفر ویژه مغازه
                            </span>
                          </div>
                          <h3 className="text-sm md:text-base font-black text-slate-900 leading-relaxed">
                            {currentShop.promotion}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-500 relative z-10 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>با ثبت امتیاز و نظر در فرم زیر، این آفر ویژه را از مغازه‌دار دریافت کنید! همچنین می‌توانید صدا و پخش ویدیو را کنترل نمایید.</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Core 2-Column Section: Form (Left) & Live Breakdown/Comments (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Form to Rate */}
                    <div id="auth-section-anchor" className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                      
                      {!currentUser ? (
                        isVerificationActive && verificationPendingUser && verificationPendingUser.role === 'customer' ? (
                          <div className="space-y-6 text-right animate-fadeIn">
                            <div className="border-b border-slate-100 pb-4">
                              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
                                تأیید هویت دو مرحله‌ای (پیامک)
                              </h3>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                کد تأیید ۶ رقمی به شماره همراه {verificationPendingUser.phoneNumber || '۰۹*********'} ارسال گردید. لطفا آن را وارد نمایید.
                              </p>
                            </div>

                            <form onSubmit={handleVerifySubmit} className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs text-slate-700 font-extrabold">کد تأیید ۶ رقمی</label>
                                <input
                                  required
                                  type="text"
                                  maxLength={6}
                                  pattern="\d{6}"
                                  placeholder="مثال: ۱۲۳۴۵۶"
                                  value={verificationInput}
                                  onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                                  className="w-full text-center text-lg tracking-[0.5em] font-mono px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 font-bold"
                                  dir="ltr"
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-slate-600 flex items-center gap-1">
                                  ⏱️ زمان باقی‌مانده: {Math.floor(verificationTimer / 60)}:{(verificationTimer % 60).toString().padStart(2, '0')}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleResendCode}
                                  className="text-amber-600 hover:text-amber-700 underline transition cursor-pointer font-bold"
                                >
                                  ارسال مجدد کد
                                </button>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition duration-150 shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                تأیید و ورود به حساب
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsVerificationActive(false);
                                  setVerificationPendingUser(null);
                                  setVerificationCode('');
                                  setVerificationInput('');
                                  setSmsNotificationVisible(false);
                                }}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                انصراف و بازگشت
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="space-y-6 animate-fadeIn">
                            <div className="border-b border-slate-100 pb-4">
                              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <User className="w-5 h-5 text-amber-500" />
                                ورود یا عضویت خریداران
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                برای ثبت نظر، ابتدا باید به عنوان خریدار وارد حساب کاربری خود شوید یا ثبت‌نام کنید.
                              </p>
                            </div>

                            {/* Mini Toggle for Login / Signup */}
                            <div className="flex justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-1 rounded-xl border border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthTab('login');
                                  setAuthError('');
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                                  authTab === 'login'
                                    ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                    : 'hover:text-slate-800'
                                }`}
                              >
                                ورود به حساب
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthTab('signup');
                                  setAuthError('');
                                }}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                                  authTab === 'signup'
                                    ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                    : 'hover:text-slate-800'
                                }`}
                              >
                                ایجاد حساب جدید
                              </button>
                            </div>

                            {authError && (
                              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-bold">
                                {authError}
                              </div>
                            )}

                            <form onSubmit={authTab === 'login' ? handleLogin : handleSignup} className="space-y-4">
                              {authTab === 'signup' && (
                                <div className="space-y-1.5">
                                  <label className="block text-xs text-slate-700 font-extrabold">نام و نام خانوادگی</label>
                                  <input
                                    required
                                    type="text"
                                    placeholder="مثال: علی محمدی"
                                    value={authFullName}
                                    onChange={(e) => setAuthFullName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all duration-200"
                                  />
                                </div>
                              )}

                              {authTab === 'signup' && (
                                <div className="space-y-1.5 animate-fadeIn">
                                  <label className="block text-xs text-slate-700 font-extrabold">شماره تلفن همراه</label>
                                  <input
                                    required
                                    type="tel"
                                    placeholder="مثال: 09123456789"
                                    value={authPhoneNumber}
                                    onChange={(e) => setAuthPhoneNumber(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200 font-mono text-slate-800"
                                  />
                                </div>
                              )}

                              <div className="space-y-1.5">
                                <label className="block text-xs text-slate-700 font-extrabold">نام کاربری</label>
                                <input
                                  required
                                  type="text"
                                  placeholder="نام کاربری خود را به انگلیسی بنویسید"
                                  value={authUsername}
                                  onChange={(e) => setAuthUsername(e.target.value)}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-xs text-slate-700 font-extrabold">رمز عبور</label>
                                <input
                                  required
                                  type="password"
                                  placeholder="••••••••"
                                  value={authPassword}
                                  onChange={(e) => setAuthPassword(e.target.value)}
                                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-black rounded-xl text-xs transition duration-150 shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {authLoading ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    در حال برقراری ارتباط...
                                  </>
                                ) : authTab === 'login' ? (
                                  'ورود به حساب کاربری'
                                ) : (
                                  'ثبت‌نام و عضویت'
                                )}
                              </button>
                            </form>
                          </div>
                        )
                      ) : (() => {
                        const userAlreadyReviewed = currentShopReviews.find(r => r.username?.toLowerCase() === currentUser?.username?.toLowerCase());
                        
                        if (submitSuccess) {
                          return (
                            <div className="text-center py-10 space-y-5 animate-scaleUp">
                              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-10 h-10 animate-bounce" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900">امتیاز شما با موفقیت ثبت شد!</h3>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                  از اینکه وقت خود را برای بهبود کیفیت خدمات به ما اختصاص دادید، صمیمانه سپاسگزاریم. نظر شما به این مغازه در خدمات‌رسانی بهتر کمک خواهد کرد.
                                </p>
                              </div>
                              <div className="pt-4">
                                <button
                                  onClick={() => setSubmitSuccess(false)}
                                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                                >
                                  مشاهده نظر ثبت شده من
                                </button>
                              </div>
                            </div>
                          );
                        }

                        if (userAlreadyReviewed) {
                          return (
                            <div className="space-y-6 text-center py-4 animate-fadeIn">
                              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-8 h-8" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900">شما قبلاً نظر خود را ثبت کرده‌اید!</h3>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                                  هر کاربر فقط می‌تواند یک نظر برای هر مغازه ارسال کند. از مشارکت شما در بهبود خدمات این کسب‌وکار سپاسگزاریم.
                                </p>
                              </div>

                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 text-right space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-800">نظر ثبت شده شما:</span>
                                  <div className="flex gap-0.5 text-amber-400" dir="ltr">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star 
                                        key={s} 
                                        className={`w-3.5 h-3.5 ${
                                          s <= userAlreadyReviewed.rating 
                                            ? 'fill-amber-400' 
                                            : 'text-slate-200'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                                  {userAlreadyReviewed.comment}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <form onSubmit={handleReviewSubmit} className="space-y-6">
                            
                            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                              <div>
                                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1">
                                  <Sparkles className="w-5 h-5 text-amber-500" />
                                  ثبت امتیاز و نظر خریدار
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">لطفا تجربه واقعی خرید خود را بنویسید.</p>
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] text-slate-400 block font-bold">ثبت نظر به عنوان:</span>
                                <span className="text-xs font-black text-amber-600 block mt-0.5">{currentUser.fullName}</span>
                              </div>
                            </div>

                            {/* Star Selection Row */}
                            <div className="space-y-2.5 text-center bg-slate-50 py-4.5 px-4 rounded-2xl border border-slate-100">
                              <label className="block text-xs text-slate-500 font-extrabold">به این مغازه چه امتیازی می‌دهید؟</label>
                              
                              <div className="flex items-center justify-center gap-1.5" dir="ltr">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setCustomerRating(star)}
                                    className="p-1 hover:scale-125 transition-transform duration-150 group cursor-pointer"
                                  >
                                    <Star 
                                      className={`w-10 h-10 transition-colors duration-200 ${
                                        star <= customerRating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-300 group-hover:text-amber-200'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>

                              {/* Descriptive text for chosen rating */}
                              <p className="text-xs font-black text-amber-700 min-h-4 font-sans">
                                {customerRating === 5 && 'عالی و فوق‌العاده - کاملا راضی هستم! ⭐⭐⭐⭐⭐'}
                                {customerRating === 4 && 'بسیار خوب - خدمات رضایت‌بخش بود ⭐⭐⭐⭐'}
                                {customerRating === 3 && 'معمولی - جا برای پیشرفت دارد ⭐⭐⭐'}
                                {customerRating === 2 && 'ضعیف - از خدمات ناراضی هستم ⭐⭐'}
                                {customerRating === 1 && 'خیلی ضعیف - اصلا توصیه نمی‌شود ⭐'}
                              </p>
                            </div>

                            {/* Comment Reason Input */}
                            <div className="space-y-2">
                              <label className="block text-xs text-slate-700 font-extrabold">توضیحات و علت امتیاز داده شده</label>
                              
                              {/* Quick Selection Shortcut Chips */}
                              <div className="flex flex-wrap gap-2 py-1" dir="rtl">
                                {[
                                  'برخورد عالی پرسنل',
                                  'قیمت مناسب',
                                  'کیفیت بالا',
                                  'تمیزی محیط'
                                ].map((reason) => {
                                  const isSelected = customerComment.includes(reason);
                                  return (
                                    <button
                                      key={reason}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          let newComment = customerComment;
                                          newComment = newComment.replace(new RegExp(`(?:،\\s*)?${reason}`, 'g'), '');
                                          newComment = newComment.trim().replace(/^،\s*/, '').replace(/،\s*$/, '').replace(/،\s*،/g, '،');
                                          setCustomerComment(newComment);
                                        } else {
                                          if (!customerComment.trim()) {
                                            setCustomerComment(reason);
                                          } else {
                                            const trimmed = customerComment.trim();
                                            if (trimmed.endsWith('،') || trimmed.endsWith('.') || trimmed.endsWith('!')) {
                                              setCustomerComment(`${trimmed} ${reason}`);
                                            } else {
                                              setCustomerComment(`${trimmed}، ${reason}`);
                                            }
                                          }
                                        }
                                      }}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-150 cursor-pointer select-none border ${
                                        isSelected
                                          ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-2xs font-extrabold'
                                          : 'bg-slate-100 border-slate-200 hover:bg-slate-200/80 text-slate-700'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      ) : (
                                        <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      )}
                                      <span>{reason}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              <textarea
                                required
                                rows={4}
                                placeholder="برای مثال: برخورد مناسب پرسنل، رعایت بهداشت، کیفیت خوب اجناس، قیمت عادلانه، سرعت در تحویل..."
                                value={customerComment}
                                onChange={(e) => setCustomerComment(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs leading-relaxed transition-all duration-200"
                              />
                            </div>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-black rounded-xl text-xs transition duration-150 shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {submittingReview ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  در حال ثبت امتیاز...
                                </>
                              ) : (
                                'ثبت نهایی امتیاز و بازخورد'
                              )}
                            </button>

                          </form>
                        );
                      })()}
                    </div>

                    {/* Right Column: Breakdown Stats & Past Comments List */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Detailed Score Progress Bars */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-xs tracking-wide uppercase">تحلیل آماری بازخوردهای مشتریان</h4>
                        
                        <div className="space-y-3.5">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const percentage = getRatingBreakdown(rating);
                            const count = currentShopReviews.filter(r => r.rating === rating).length;
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-10 shrink-0">
                                  <span className="text-xs text-slate-600 font-bold">{rating}</span>
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                </div>
                                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-500 font-black w-14 text-left">{percentage}% ({count})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rating Trend Chart for Customer View */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                              <TrendingUp className="w-5.5 h-5.5 text-amber-500" />
                            </div>
                            <div className="text-right">
                              <h4 className="font-black text-slate-900 text-sm">روند تغییرات امتیازات و نظرات مغازه</h4>
                              <p className="text-[10px] text-slate-400 font-bold">بررسی آماری و میزان رضایتمندی در بازه زمانی اخیر</p>
                            </div>
                          </div>
                          
                          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 self-stretch sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setCustomerChartTimeframe(7)}
                              className={`flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 cursor-pointer ${
                                customerChartTimeframe === 7
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              هفته اخیر
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerChartTimeframe(30)}
                              className={`flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 cursor-pointer ${
                                customerChartTimeframe === 30
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              ماه اخیر
                            </button>
                          </div>
                        </div>

                        {currentShopReviews.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            هنوز هیچ رایی برای این مغازه ثبت نشده است تا نمودار نمایش داده شود.
                          </div>
                        ) : (
                          <div className="w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                              <ComposedChart data={getChartData(customerChartTimeframe, currentShopReviews)} margin={{ top: 10, right: -15, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="customerColorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="label" 
                                  stroke="#94a3b8" 
                                  fontSize={10} 
                                  fontWeight="bold" 
                                  tickLine={false} 
                                />
                                <YAxis 
                                  yAxisId="left" 
                                  orientation="left" 
                                  stroke="#94a3b8" 
                                  fontSize={10} 
                                  fontWeight="bold" 
                                  tickLine={false}
                                  allowDecimals={false}
                                />
                                <YAxis 
                                  yAxisId="right" 
                                  orientation="right" 
                                  stroke="#10b981" 
                                  fontSize={10} 
                                  fontWeight="bold" 
                                  tickLine={false}
                                  domain={[1, 5]}
                                  tickCount={5}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                  verticalAlign="top" 
                                  height={36} 
                                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                                />
                                <Bar 
                                  yAxisId="left" 
                                  name="تعداد نظرات روزانه"
                                  dataKey="تعداد نظرات" 
                                  barSize={20} 
                                  fill="#f59e0b" 
                                  radius={[4, 4, 0, 0]} 
                                />
                                <Line 
                                  yAxisId="right" 
                                  type="monotone" 
                                  name="میانگین کل امتیازات تا این روز"
                                  dataKey="روند کل امتیاز" 
                                  stroke="#10b981" 
                                  strokeWidth={3} 
                                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                  activeDot={{ r: 6 }} 
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>

                      {/* Comments Feed List */}
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <h4 className="font-black text-slate-950 text-base flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-slate-400" />
                            نظرات و دلایل امتیاز کاربران ({currentShopReviews.length})
                          </h4>

                          {/* Customer Filter buttons */}
                          {currentShopReviews.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-bold ml-1 flex items-center gap-1">
                                <SlidersHorizontal className="w-3 h-3" />
                                فیلتر:
                              </span>
                              <button
                                type="button"
                                onClick={() => setCustomerReviewFilter(0)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                                  customerReviewFilter === 0
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                همه
                              </button>
                              {[5, 4, 3, 2, 1].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setCustomerReviewFilter(s)}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all duration-150 flex items-center gap-0.5 cursor-pointer ${
                                    customerReviewFilter === s
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <span>{s}</span>
                                  <Star className={`w-2.5 h-2.5 ${customerReviewFilter === s ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {currentShopReviews.length === 0 ? (
                          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center text-slate-400">
                            <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-slate-500 mb-2" />
                            <p className="font-bold text-xs">هنوز هیچ بازخوردی برای این مغازه ثبت نشده است.</p>
                            <p className="text-xs mt-1 opacity-80">اولین کسی باشید که تجربه خود را می‌نویسد!</p>
                          </div>
                        ) : customerFilteredReviews.length === 0 ? (
                          <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center text-slate-400">
                            <MessageSquare className="w-10 h-10 mx-auto opacity-30 text-slate-500 mb-2" />
                            <p className="font-bold text-xs">هیچ بازخوردی با امتیاز {customerReviewFilter} ستاره برای این مغازه یافت نشد.</p>
                            <button
                              type="button"
                              onClick={() => setCustomerReviewFilter(0)}
                              className="mt-3 text-xs font-black text-amber-600 hover:text-amber-700 underline cursor-pointer"
                            >
                              مشاهده همه نظرات
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {customerFilteredReviews.map((rev) => (
                              <div 
                                key={rev.id} 
                                className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-xs space-y-3 hover:shadow-xs transition duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                                      {rev.customerName.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-slate-800">{rev.customerName}</span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">{formatPersianDate(rev.createdAt)}</span>
                                    </div>
                                  </div>

                                  {/* User score stars */}
                                  <div className="flex gap-0.5" dir="ltr">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star 
                                        key={s} 
                                        className={`w-3.5 h-3.5 ${
                                          s <= rev.rating 
                                            ? 'fill-amber-400 text-amber-400' 
                                            : 'text-slate-200'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-50">
                                  {rev.comment}
                                </p>

                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleLikeReview(rev.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition duration-150 cursor-pointer select-none ${
                                      currentUser && rev.likes?.includes(currentUser.username)
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                                  >
                                    <ThumbsUp className={`w-3.5 h-3.5 ${currentUser && rev.likes?.includes(currentUser.username) ? 'fill-white text-white' : 'text-slate-400'}`} />
                                    <span>
                                      {currentUser && rev.likes?.includes(currentUser.username) ? 'پسندیده شد' : 'مفید بود'}
                                    </span>
                                    {rev.likes && rev.likes.length > 0 && (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        currentUser && rev.likes?.includes(currentUser.username)
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {rev.likes.length}
                                      </span>
                                    )}
                                  </button>

                                  {reportingReviewId === rev.id ? null : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!currentUser) {
                                          alert('برای گزارش تخلف ابتدا باید وارد حساب کاربری خود شوید.');
                                          const authContainer = document.getElementById('auth-section-anchor');
                                          if (authContainer) {
                                            authContainer.scrollIntoView({ behavior: 'smooth' });
                                          }
                                          return;
                                        }
                                        setReportingReviewId(rev.id);
                                        setReportingError('');
                                        setReportingSuccess('');
                                        setReportingReason('');
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black transition duration-150 cursor-pointer select-none ${
                                        rev.reports?.some((rep: any) => rep.reporter?.toLowerCase() === currentUser?.username?.toLowerCase())
                                          ? 'bg-red-50 border-red-200 text-red-600 font-extrabold cursor-not-allowed'
                                          : 'bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                                      }`}
                                      disabled={rev.reports?.some((rep: any) => rep.reporter?.toLowerCase() === currentUser?.username?.toLowerCase())}
                                    >
                                      <Flag className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {rev.reports?.some((rep: any) => rep.reporter?.toLowerCase() === currentUser?.username?.toLowerCase())
                                          ? 'گزارش شده'
                                          : 'گزارش تخلف'}
                                      </span>
                                      {rev.reports && rev.reports.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-100 text-red-800 font-black shrink-0">
                                          {rev.reports.length}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Report Violation inline panel */}
                                {reportingReviewId === rev.id && (
                                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-3 text-right animate-fadeIn">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-rose-950 flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                        گزارش تخلف یا اسپم برای بررسی مدیر سیستم
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReportingReviewId('');
                                          setReportingError('');
                                          setReportingSuccess('');
                                          setReportingReason('');
                                        }}
                                        className="text-[10px] text-slate-500 hover:text-slate-700 underline font-bold cursor-pointer"
                                      >
                                        انصراف
                                      </button>
                                    </div>

                                    {reportingError && (
                                      <div className="bg-red-100/50 border border-red-200 text-red-700 text-[10px] font-extrabold p-2 rounded-xl text-center">
                                        {reportingError}
                                      </div>
                                    )}

                                    {reportingSuccess && (
                                      <div className="bg-emerald-100/40 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold p-2 rounded-xl text-center">
                                        {reportingSuccess}
                                      </div>
                                    )}

                                    {!reportingSuccess && (
                                      <div className="space-y-2">
                                        {/* Shortcut reason chips */}
                                        <div className="flex flex-wrap gap-1.5 justify-start" dir="rtl">
                                          {[
                                            'اسپم یا تبلیغات غیرمجاز',
                                            'توهین‌آمیز یا نامناسب',
                                            'اطلاعات دروغ یا نادرست',
                                            'سایر دلایل'
                                          ].map((preset) => (
                                            <button
                                              key={preset}
                                              type="button"
                                              onClick={() => setReportingReason(preset)}
                                              className={`px-2 py-1 text-[10px] rounded-lg transition-all cursor-pointer font-bold border ${
                                                reportingReason === preset
                                                  ? 'bg-rose-600 border-rose-600 text-white'
                                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                              }`}
                                            >
                                              {preset}
                                            </button>
                                          ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={reportingReason}
                                            onChange={(e) => setReportingReason(e.target.value)}
                                            placeholder="علت را بنویسید یا از بالا انتخاب کنید..."
                                            className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-bold bg-white text-right"
                                          />
                                          <button
                                            type="button"
                                            disabled={reportingLoading}
                                            onClick={() => handleReportReview(rev.id, reportingReason)}
                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition cursor-pointer disabled:opacity-50 shrink-0"
                                          >
                                            {reportingLoading ? 'در حال ثبت...' : 'ارسال گزارش'}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* =========================================================== */}
          {/* =================== B. SHOPKEEPER TAB =================== */}
          {/* =========================================================== */}
          {activeTab === 'shopkeeper' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header inside Panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                    پنل مدیریت مغازه‌داران و کد QR
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-bold">مغازه خود را ثبت کرده و کد QR اختصاصی آن را جهت نصب بر روی دیوار دانلود و چاپ کنید.</p>
                </div>

                <div className="flex gap-2">
                  {Object.keys(shops).length >= 1 ? (
                    <div className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200/60 rounded-xl px-3.5 py-2.5 flex items-center gap-1.5 leading-normal">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      سیستم به ثبت یک مغازه محدود شده است. برای ثبت مغازه جدید ابتدا مغازه فعلی را حذف کنید.
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddShopModal(true)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      ثبت مغازه جدید
                    </button>
                  )}
                </div>
              </div>

              {!currentUser || currentUser.role !== 'shopkeeper' ? (
                <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 print:hidden">
                  {isVerificationActive && verificationPendingUser && verificationPendingUser.role === 'shopkeeper' ? (
                    <div className="space-y-6 text-right animate-fadeIn">
                      <div className="border-b border-slate-100 pb-4 text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                          <Shield className="w-8 h-8 animate-pulse text-amber-600" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-lg">تأیید هویت دو مرحله‌ای (پیامک)</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          کد تأیید ۶ رقمی به شماره همراه {verificationPendingUser.phoneNumber || authPhoneNumber || '۰۹*********'} ارسال گردید. لطفا آن را وارد نمایید.
                        </p>
                      </div>

                      <form onSubmit={handleVerifySubmit} className="space-y-4 text-right">
                        <div className="space-y-1.5">
                          <label className="block text-xs text-slate-700 font-extrabold">کد تأیید ۶ رقمی</label>
                          <input
                            required
                            type="text"
                            maxLength={6}
                            pattern="\d{6}"
                            placeholder="مثال: ۱۲۳۴۵۶"
                            value={verificationInput}
                            onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center text-lg tracking-[0.5em] font-mono px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all duration-200 font-bold"
                            dir="ltr"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-600 flex items-center gap-1">
                            ⏱️ زمان باقی‌مانده: {Math.floor(verificationTimer / 60)}:{(verificationTimer % 60).toString().padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={handleResendCode}
                            className="text-amber-600 hover:text-amber-700 underline transition cursor-pointer font-bold"
                          >
                            ارسال مجدد کد
                          </button>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition duration-150 shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          تأیید و ورود به پنل مدیریت
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsVerificationActive(false);
                            setVerificationPendingUser(null);
                            setVerificationCode('');
                            setVerificationInput('');
                            setSmsNotificationVisible(false);
                          }}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          انصراف و بازگشت
                        </button>
                      </form>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <User className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-slate-900">ورود به پنل مدیریت مغازه‌داران</h3>
                        {currentUser && currentUser.role !== 'shopkeeper' ? (
                          <p className="text-xs text-rose-600 leading-relaxed font-bold">
                            شما با حساب خریدار وارد شده‌اید. برای دسترسی به پنل مدیریت مغازه‌داران، ابتدا باید از حساب خود خارج شده و به عنوان مغازه‌دار وارد شوید.
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 leading-relaxed">
                            برای دسترسی به پنل مغازه‌داران، ثبت مغازه، دریافت کد QR و ثبت تبلیغات، ابتدا باید وارد حساب کاربری مغازه‌دار خود شوید یا حساب جدید بسازید.
                          </p>
                        )}
                      </div>
                      
                      {currentUser && currentUser.role !== 'shopkeeper' ? (
                        <button
                          onClick={handleLogout}
                          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl transition cursor-pointer w-full"
                        >
                          خروج از حساب خریدار
                        </button>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-right">
                          <div className="flex justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 p-1 rounded-xl border border-slate-200/60 mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthTab('login');
                                setAuthRole('shopkeeper');
                                setAuthError('');
                              }}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                                authTab === 'login'
                                  ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                  : 'hover:text-slate-800'
                              }`}
                            >
                              ورود به حساب
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAuthTab('signup');
                                setAuthRole('shopkeeper');
                                setAuthError('');
                              }}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                                authTab === 'signup'
                                  ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                  : 'hover:text-slate-800'
                              }`}
                            >
                              ایجاد حساب جدید
                            </button>
                          </div>

                          {authError && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-bold mb-4">
                              {authError}
                            </div>
                          )}

                          <form onSubmit={authTab === 'login' ? handleLogin : handleSignup} className="space-y-4">
                            {authTab === 'signup' && (
                              <div className="space-y-1.5">
                                <label className="block text-xs text-slate-700 font-extrabold">نام و نام خانوادگی</label>
                                <input
                                  required
                                  type="text"
                                  placeholder="مثال: علی محمدی"
                                  value={authFullName}
                                  onChange={(e) => setAuthFullName(e.target.value)}
                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all duration-200"
                                />
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="block text-xs text-slate-700 font-extrabold">نام کاربری</label>
                              <input
                                required
                                type="text"
                                placeholder="نام کاربری به انگلیسی"
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200 font-mono"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs text-slate-700 font-extrabold">رمز عبور</label>
                              <input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200 font-mono"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-xs text-slate-700 font-extrabold">شماره تلفن همراه</label>
                              <input
                                required
                                type="tel"
                                placeholder="مثال: 09123456789"
                                value={authPhoneNumber}
                                onChange={(e) => setAuthPhoneNumber(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all duration-200 font-mono text-slate-800"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={authLoading}
                              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-black rounded-xl text-xs transition duration-150 shadow-md shadow-amber-500/15 flex items-center justify-center gap-2 cursor-pointer mt-4"
                            >
                              {authLoading ? 'در حال ارسال...' : authTab === 'login' ? 'ورود به پنل مدیریت' : 'ثبت‌نام و ورود'}
                            </button>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Case B1: No shops registered at all in the database */}
              {Object.keys(shops).length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-6 print:hidden">
                  <Store className="w-16 h-16 text-slate-400 mx-auto opacity-30" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">هیچ مغازه‌ای ثبت نشده است</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      برای شروع دریافت بازخوردهای مشتریان، ابتدا مشخصات مغازه خود را در دکمه زیر وارد کنید تا کد QR منحصربه‌فرد برای شما تولید شود.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddShopModal(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition cursor-pointer"
                  >
                    ثبت مغازه جدید همین حالا
                  </button>
                </div>
              ) : (
                
                // Case B2: Normal Grid Dashboard for existing shops
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
                  
                  {/* Left Selector: Choose Shop & Manage Info (Hidden in print) */}
                  <div className="lg:col-span-4 space-y-5 print:hidden">
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                      <label className="block text-xs font-extrabold text-slate-500">انتخاب مغازه جهت مدیریت</label>
                      
                      <div className="space-y-2">
                        {(Object.values(shops) as Shop[]).map((shop) => (
                          <button
                            key={shop.id}
                            onClick={() => {
                              setShopkeeperSelectedShopId(shop.id);
                              setReviewFilter(0); // reset review filter
                            }}
                            className={`w-full text-right p-3.5 rounded-xl border text-xs font-bold transition duration-150 flex items-center justify-between cursor-pointer ${
                              shopkeeperSelectedShopId === shop.id
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{shop.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({reviews.filter(r => r.shopId === shop.id).length} بازخورد)</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Selected Shop Profile Specs Card */}
                    {selectedShopObj && (
                      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                        <h4 className="text-xs font-black text-slate-400 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-slate-400" />
                          مشخصات عمومی مغازه
                        </h4>
                        
                        <div className="space-y-3 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-400">شناسه اختصاصی (QR Link Slug):</span>
                            <span className="block font-mono text-slate-700 font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1">{selectedShopObj.id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">نام کامل صنف:</span>
                            <span className="block font-bold text-slate-800 mt-1">{selectedShopObj.name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium">آدرس پستی:</span>
                            <span className="block text-slate-600 leading-relaxed mt-1">{selectedShopObj.address || 'ثبت نشده'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium font-bold">توضیح کوتاه:</span>
                            <span className="block text-slate-600 leading-relaxed mt-1">{selectedShopObj.description || 'ثبت نشده'}</span>
                          </div>

                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] text-slate-400 font-medium font-bold block">موقعیت جغرافیایی روی نقشه:</span>
                            <div className="w-full h-[180px] rounded-xl overflow-hidden border border-slate-200">
                              <ShopMap
                                address={selectedShopObj.address || ''}
                                lat={tempLat}
                                lng={tempLng}
                                shopName={selectedShopObj.name}
                                readOnly={!isShopOwner}
                                onLocationSelect={(lat, lng) => {
                                  setTempLat(lat);
                                  setTempLng(lng);
                                }}
                              />
                            </div>
                            {isShopOwner && tempLat && tempLng && (tempLat !== selectedShopObj.lat || tempLng !== selectedShopObj.lng) && (
                              <button
                                type="button"
                                onClick={handleSaveMapLocation}
                                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                💾 ذخیره موقعیت جدید روی نقشه
                              </button>
                            )}
                          </div>

                          <div className="bg-amber-50/50 border border-amber-100/70 rounded-xl p-3 space-y-1.5">
                            <span className="text-[10px] text-amber-800 font-black flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              تبلیغ یا پیشنهاد ویژه فعلی:
                            </span>
                            <p className="text-[11px] text-amber-900 leading-relaxed font-bold">
                              {selectedShopObj.promotion || 'هنوز هیچ تبلیغ یا پیشنهاد ویژه‌ای ثبت نشده است.'}
                            </p>
                          </div>

                          {isShopOwner ? (
                            <div className="pt-2.5 border-t border-slate-100 space-y-2">
                              <label className="block text-[10px] font-black text-slate-500">ویرایش/ثبت تبلیغ یا پیشنهاد ویژه:</label>
                              <textarea
                                rows={2}
                                value={editingPromotion}
                                onChange={(e) => setEditingPromotion(e.target.value)}
                                placeholder="مثال: ۱۰٪ تخفیف روی تمام سفارشات با ارائه این صفحه!"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs transition"
                              />

                              {/* Video section */}
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 mt-2">
                                <span className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-amber-500" />
                                  ویدیو یا تیزر تبلیغاتی مغازه
                                </span>

                                {/* Upload from Gallery Field */}
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-500">بارگذاری فیلم جدید از گالری گوشی یا کامپیوتر:</label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-white border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/20 rounded-xl cursor-pointer transition text-center">
                                      <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                        <Upload className="w-4 h-4 text-slate-500" />
                                        {uploadingVideo ? 'در حال بارگذاری فیلم...' : 'انتخاب فیلم از گالری'}
                                      </span>
                                      <input 
                                        type="file" 
                                        accept="video/*" 
                                        onChange={(e) => handleVideoUpload(e, true)} 
                                        className="hidden" 
                                        disabled={uploadingVideo}
                                      />
                                    </label>
                                  </div>
                                  {uploadError && (
                                    <p className="text-[10px] font-extrabold text-red-500 mt-1">{uploadError}</p>
                                  )}
                                </div>

                                <div className="relative flex py-2 items-center">
                                  <div className="flex-grow border-t border-slate-200"></div>
                                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold">یا انتخاب از ویدیوهای آماده</span>
                                  <div className="flex-grow border-t border-slate-200"></div>
                                </div>

                                <label className="block text-[10px] font-black text-slate-500">انتخاب تیزر پیش‌فرض بر اساس صنف:</label>
                                <select
                                  value={editingPromotionVideo}
                                  onChange={(e) => setEditingPromotionVideo(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs transition"
                                >
                                  {PROMOTION_VIDEO_PRESETS.map((preset) => (
                                    <option key={preset.id} value={preset.id}>
                                      {preset.name}
                                    </option>
                                  ))}
                                  <option value="custom">آدرس لینک ویدیو سفارشی...</option>
                                </select>

                                {(editingPromotionVideo === 'custom' || (editingPromotionVideo && editingPromotionVideo.startsWith('http') && !editingPromotionVideo.includes('/uploads/'))) && (
                                  <input
                                    type="text"
                                    placeholder="آدرس اینترنتی ویدیو (مثال: https://example.com/video.mp4)"
                                    value={editingPromotionVideo.startsWith('http') ? editingPromotionVideo : ''}
                                    onChange={(e) => setEditingPromotionVideo(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 outline-none text-xs transition mt-1"
                                    dir="ltr"
                                  />
                                )}

                                {/* Live Video Preview inside Form */}
                                <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 aspect-[16/9] relative bg-slate-900">
                                  <video 
                                    key={editingPromotionVideo}
                                    src={
                                      editingPromotionVideo && (editingPromotionVideo.startsWith('http') || editingPromotionVideo.startsWith('/uploads'))
                                        ? editingPromotionVideo
                                        : (PROMOTION_VIDEO_PRESETS.find(p => p.id === editingPromotionVideo)?.url || 'https://assets.mixkit.co/videos/preview/mixkit-paying-by-card-at-a-cash-register-42340-large.mp4')
                                    } 
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                  />
                                  <div className="absolute bottom-2 right-2 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs pointer-events-none">
                                    <span className="text-[9px] text-white font-extrabold">پیش‌نمایش زنده تیزر تبلیغات</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/shops/${selectedShopObj.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        promotion: editingPromotion,
                                        promotionVideo: editingPromotionVideo,
                                        ownerUsername: currentUser?.username || ''
                                      })
                                    });
                                    if (res.ok) {
                                      await fetchDatabaseData();
                                      alert('تبلیغ مغازه با موفقیت ثبت/ویرایش شد!');
                                    } else {
                                      const errData = await res.json();
                                      alert(errData.error || 'خطا در به‌روزرسانی تبلیغ');
                                    }
                                  } catch (e) {
                                    console.error(e);
                                    alert('خطا در ارتباط با سرور');
                                  }
                                }}
                                className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                ثبت و فعال‌سازی تبلیغ
                              </button>
                            </div>
                          ) : (
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                              <div className="p-4 bg-rose-50/60 border border-rose-100/60 rounded-2xl text-right">
                                <h5 className="text-xs font-black text-rose-800 flex items-center gap-2 mb-1.5">
                                  <X className="w-4 h-4 text-rose-500" />
                                  غیرمجاز برای ثبت تبلیغات
                                </h5>
                                <p className="text-[11px] text-rose-600 font-bold leading-relaxed">
                                  شما مالک این مغازه نیستید. فقط مالک مغازه ({selectedShopObj.owner || 'مدیر سیستم'}) می‌تواند تبلیغات یا فیلم ویژه ثبت یا ویرایش کند.
                                </p>
                              </div>
                            </div>
                          )}

                          {isShopOwner && (
                            <div className="pt-3 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`آیا از حذف مغازه "${selectedShopObj.name}" و تمامی نظرات مربوط به آن اطمینان دارید؟`)) {
                                    try {
                                      const res = await fetch(`/api/shops/${selectedShopObj.id}?ownerUsername=${currentUser?.username || ''}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        await fetchDatabaseData();
                                        setShopkeeperSelectedShopId('');
                                      } else {
                                        const errData = await res.json();
                                        alert(errData.error || 'خطا در حذف مغازه');
                                      }
                                    } catch (e) {
                                      console.error(e);
                                      alert('خطا در ارتباط با سرور');
                                    }
                                  }
                                }}
                                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                حذف مغازه و اطلاعات آن
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Panel: Shows QR code + poster generator & detailed reviews for chosen shop */}
                  <div className="lg:col-span-8 space-y-8 print:w-full">
                    
                    {selectedShopObj && (
                      <>
                        {/* QR Code Card & Poster Preview Panel */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-8 print:hidden">
                          
                          <div className="w-48 h-48 border border-slate-100 rounded-2xl p-2.5 bg-white shadow-xs shrink-0 flex items-center justify-center">
                            {qrCodeDataUrl ? (
                              <img src={qrCodeDataUrl} alt="QR Code Link" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xs text-slate-400">در حال تولید...</span>
                            )}
                          </div>

                          <div className="space-y-4 flex-1 text-center md:text-right">
                            <div className="space-y-1">
                              <span className="text-[11px] text-amber-700 font-extrabold bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">آماده نصب روی دیوار</span>
                              <h3 className="font-black text-slate-900 text-lg">کد QR اختصاصی {selectedShopObj.name}</h3>
                              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                                این کد QR مستقیماً به صفحه ثبت نظر مغازه شما متصل است. تصویر آن را دریافت کنید و برای چاپ با ابعاد مناسب در دید مشتریان قرار دهید.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1.5">
                              <button
                                onClick={handleDownloadQR}
                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                دانلود تصویر QR (PNG)
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                                چاپ پوستر دیواری A4
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* ======================================================== */}
                        {/* ============ GORGEOUS A4 PRINTABLE POSTER ============= */}
                        {/* ======================================================== */}
                        {/* Hidden normally via Tailwind block classes, visible only in print state through index.html */}
                        <div id="printable-qr-poster" className="hidden print:block bg-white text-slate-900 p-12 text-center border-8 border-amber-500 rounded-3xl space-y-12 max-w-[800px] mx-auto min-h-[1050px]">
                          
                          {/* Poster Header */}
                          <div className="space-y-6 pt-4">
                            <div className="w-20 h-20 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                              <Store className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                              <h1 className="text-4xl font-black tracking-tight text-slate-900">نظر شما به ما انرژی می‌دهد!</h1>
                              <p className="text-lg text-slate-500 font-bold">با اسکن کد زیر، به ما امتیاز دهید و نظرتان را به اشتراک بگذارید.</p>
                            </div>
                          </div>

                          {/* Big QR Code container */}
                          <div className="space-y-4 my-10">
                            <div className="w-80 h-80 border-4 border-amber-500 rounded-3xl p-4 bg-white mx-auto shadow-md flex items-center justify-center">
                              {qrCodeDataUrl ? (
                                <img src={qrCodeDataUrl} alt="Store QR Poster" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-slate-400">در حال تولید...</span>
                              )}
                            </div>
                            <p className="text-sm font-mono text-slate-400 tracking-widest">{window.location.origin}?shop={selectedShopObj.id}</p>
                          </div>

                          {/* Poster Footer */}
                          <div className="border-t-2 border-dashed border-amber-200 pt-8 space-y-4">
                            <h2 className="text-3xl font-black text-slate-900">{selectedShopObj.name}</h2>
                            {selectedShopObj.description && (
                              <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed">{selectedShopObj.description}</p>
                            )}
                            {selectedShopObj.address && (
                              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{selectedShopObj.address}</p>
                            )}
                          </div>

                          <div className="pt-8 text-xs text-slate-400 font-bold">
                            طراحی و پشتیبانی توسط سامانه هوشمند امتیازدهی کیوآر
                          </div>

                        </div>

                        {/* Interactive Admin Review Stats & Filtering */}
                        <div className="space-y-5 print:hidden">

                          {/* AI Review Analysis and Auto-Categorization */}
                          <div className="bg-gradient-to-br from-amber-500/10 via-white to-orange-500/5 border border-amber-500/20 rounded-3xl p-6 shadow-xs space-y-6 print:hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100/50 pb-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                  <Sparkles className="w-5.5 h-5.5 text-amber-600 animate-pulse" />
                                </div>
                                <div className="text-right">
                                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                    تحلیل هوشمند بازخوردهای مشتریان
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">Gemini AI</span>
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold">دسته‌بندی و تحلیل خودکار متن نظرات جهت بهبود عملکرد مغازه</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={aiLoading}
                                onClick={() => fetchAiSummary(selectedShopObj.id)}
                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white text-[10px] font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                                به‌روزرسانی تحلیل
                              </button>
                            </div>

                            {aiLoading ? (
                              <div className="py-12 space-y-4 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-500 animate-spin border-2 border-amber-500 border-t-transparent"></div>
                                <p className="text-xs text-slate-500 font-extrabold animate-pulse">هوش مصنوعی در حال بررسی و تحلیل دقیق نظرات کاربران مغازه شماست...</p>
                              </div>
                            ) : aiError ? (
                              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2 text-right">
                                <div className="flex items-center gap-2 text-red-800">
                                  <AlertTriangle className="w-5 h-5 shrink-0" />
                                  <span className="text-xs font-black">بروز خطا در تحلیل نظرات</span>
                                </div>
                                <p className="text-[11px] text-red-600 leading-relaxed font-bold">{aiError}</p>
                                <button
                                  type="button"
                                  onClick={() => fetchAiSummary(selectedShopObj.id)}
                                  className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition"
                                >
                                  تلاش مجدد
                                </button>
                              </div>
                            ) : aiSummary ? (
                              !aiSummary.hasReviews ? (
                                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-30" />
                                  <p className="text-xs text-slate-500 font-bold">{aiSummary.summary}</p>
                                </div>
                              ) : (
                                <div className="space-y-6 animate-fadeIn">
                                  {/* Summary block */}
                                  <div className="bg-white/80 border border-slate-100 rounded-2xl p-4 md:p-5 shadow-xs space-y-2">
                                    <h4 className="text-[11px] font-black text-amber-800 flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-amber-500" />
                                      جمع‌بندی و برآیند کلی بازخوردها:
                                    </h4>
                                    <p className="text-xs text-slate-700 leading-relaxed font-bold font-sans">
                                      {aiSummary.summary}
                                    </p>
                                  </div>

                                  {/* Strengths and Weaknesses Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Strengths */}
                                    <div className="bg-emerald-50/35 border border-emerald-100/60 rounded-2xl p-4.5 space-y-3">
                                      <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5 border-b border-emerald-100/40 pb-2">
                                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                                        نقاط قوت کلیدی ({aiSummary.strengths?.length || 0})
                                      </h4>
                                      {aiSummary.strengths && aiSummary.strengths.length > 0 ? (
                                        <ul className="space-y-2 text-right">
                                          {aiSummary.strengths.map((str: string, index: number) => (
                                            <li key={index} className="text-xs text-emerald-900 font-bold flex items-start gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                              <span>{str}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[10px] text-slate-400 font-bold">مورد خاصی شناسایی نشد.</p>
                                      )}
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="bg-rose-50/30 border border-rose-100/50 rounded-2xl p-4.5 space-y-3">
                                      <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5 border-b border-rose-100/40 pb-2">
                                        <ThumbsDown className="w-4 h-4 text-rose-500" />
                                        نقاط ضعف و نیاز به بهبود ({aiSummary.weaknesses?.length || 0})
                                      </h4>
                                      {aiSummary.weaknesses && aiSummary.weaknesses.length > 0 ? (
                                        <ul className="space-y-2 text-right">
                                          {aiSummary.weaknesses.map((weak: string, index: number) => (
                                            <li key={index} className="text-xs text-rose-900 font-bold flex items-start gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                              <span>{weak}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-[10px] text-slate-400 font-bold">مورد خاصی شناسایی نشد.</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Categorization overview */}
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                      <TrendingUp className="w-4 h-4 text-slate-500" />
                                      دسته‌بندی موضوعی بازخوردها:
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {aiSummary.categories && aiSummary.categories.map((cat: any, idx: number) => {
                                        const isPositive = cat.sentiment === 'مثبت';
                                        const isNegative = cat.sentiment === 'منفی';
                                        
                                        return (
                                          <div key={idx} className="bg-white border border-slate-100 hover:border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs transition">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-black text-slate-800">{cat.name}</span>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] text-slate-400 font-bold">({cat.count} نظر)</span>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                                  isPositive 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                                                    : isNegative 
                                                      ? 'bg-rose-50 text-rose-700 border border-rose-200/50' 
                                                      : 'bg-slate-50 text-slate-600 border border-slate-200/50'
                                                }`}>
                                                  {cat.sentiment}
                                                </span>
                                              </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                                              {cat.description}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                <Sparkles className="w-8 h-8 text-amber-500/60 mx-auto opacity-40" />
                                <p className="text-xs text-slate-500 font-bold">تحلیل هوش مصنوعی برای این مغازه بارگذاری نشده است.</p>
                                <button
                                  type="button"
                                  onClick={() => fetchAiSummary(selectedShopObj.id)}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-xl transition cursor-pointer"
                                >
                                  تحلیل بازخوردهای کاربران با هوش مصنوعی
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Live stat grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 block font-bold">میانگین رضایت مندی</span>
                                <span className="text-2xl font-black text-slate-900">{selectedShopAvgRating} از ۵</span>
                              </div>
                              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                              </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 block font-bold">تعداد کل آراء ثبت شده</span>
                                <span className="text-2xl font-black text-slate-900">{selectedShopReviews.length} رأی</span>
                              </div>
                              <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-slate-400 block font-bold">میزان وفاداری (۴ و ۵ ستاره)</span>
                                <span className="text-2xl font-black text-emerald-600">
                                  {selectedShopReviews.length > 0 
                                    ? Math.round((selectedShopReviews.filter(r => r.rating >= 4).length / selectedShopReviews.length) * 100)
                                    : 0}%
                                </span>
                              </div>
                              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5" />
                              </div>
                            </div>
                          </div>

                          {/* Rating Trend Chart */}
                          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                  <TrendingUp className="w-5.5 h-5.5 text-amber-500" />
                                </div>
                                <div className="text-right">
                                  <h4 className="font-black text-slate-900 text-sm">روند تغییرات امتیازات و نظرات</h4>
                                  <p className="text-[10px] text-slate-400 font-bold">بررسی آماری و میزان رضایتمندی در بازه زمانی اخیر</p>
                                </div>
                              </div>
                              
                              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 self-stretch sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => setChartTimeframe(7)}
                                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 cursor-pointer ${
                                    chartTimeframe === 7
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-950'
                                  }`}
                                >
                                  هفته اخیر
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChartTimeframe(30)}
                                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-200 cursor-pointer ${
                                    chartTimeframe === 30
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-950'
                                  }`}
                                >
                                  ماه اخیر
                                </button>
                              </div>
                            </div>

                            {selectedShopReviews.length === 0 ? (
                              <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                هنوز هیچ رایی برای این مغازه ثبت نشده است تا نمودار نمایش داده شود.
                              </div>
                            ) : (
                              <div className="w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height={300}>
                                  <ComposedChart data={getChartData(chartTimeframe, selectedShopReviews)} margin={{ top: 10, right: -15, left: -25, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                      dataKey="label" 
                                      stroke="#94a3b8" 
                                      fontSize={10} 
                                      fontWeight="bold" 
                                      tickLine={false} 
                                    />
                                    <YAxis 
                                      yAxisId="left" 
                                      orientation="left" 
                                      stroke="#94a3b8" 
                                      fontSize={10} 
                                      fontWeight="bold" 
                                      tickLine={false}
                                      allowDecimals={false}
                                    />
                                    <YAxis 
                                      yAxisId="right" 
                                      orientation="right" 
                                      stroke="#10b981" 
                                      fontSize={10} 
                                      fontWeight="bold" 
                                      tickLine={false}
                                      domain={[1, 5]}
                                      tickCount={5}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                      verticalAlign="top" 
                                      height={36} 
                                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                                    />
                                    <Bar 
                                      yAxisId="left" 
                                      name="تعداد نظرات روزانه"
                                      dataKey="تعداد نظرات" 
                                      barSize={20} 
                                      fill="#f59e0b" 
                                      radius={[4, 4, 0, 0]} 
                                    />
                                    <Line 
                                      yAxisId="right" 
                                      type="monotone" 
                                      name="میانگین کل امتیازات تا این روز"
                                      dataKey="روند کل امتیاز" 
                                      stroke="#10b981" 
                                      strokeWidth={3} 
                                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                      activeDot={{ r: 6 }} 
                                    />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>



                        </div>
                      </>
                    )}

                  </div>

                </div>
              )}
                </>
              )}

            </div>
          )}

          {/* =========================================================== */}
          {/* ==================== C. ADMIN TAB ======================= */}
          {/* =========================================================== */}
          {activeTab === 'admin' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header inside Panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-slate-800" />
                    پنل مدیریت کل سیستم (ادمین)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-bold">نظارت بر مغازه‌ها، نظرات کاربران، آمار کل سامانه و مدیریت دسترسی‌ها</p>
                </div>
              </div>

              {!currentUser || currentUser.role !== 'admin' ? (
                <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-6 print:hidden">
                  <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">ورود به پنل ادمین</h3>
                    {currentUser && currentUser.role !== 'admin' ? (
                      <p className="text-xs text-rose-600 leading-relaxed font-bold">
                        شما با حساب {currentUser.role === 'shopkeeper' ? 'مغازه‌دار' : 'خریدار'} وارد شده‌اید. برای دسترسی به پنل مدیریت کل، ابتدا باید از حساب خود خارج شده و به عنوان ادمین وارد شوید.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        برای دسترسی به ابزارهای مدیریتی و نظارتی کل سامانه، لطفا نام کاربری و رمز عبور ادمین خود را وارد نمایید یا حساب جدید ادمین بسازید.
                      </p>
                    )}
                  </div>
                  
                  {currentUser && currentUser.role !== 'admin' ? (
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl transition cursor-pointer w-full"
                    >
                      خروج از حساب فعلی
                    </button>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-right">
                      {adminCount < 1 ? (
                        <div className="flex justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 p-1 rounded-xl border border-slate-200/60 mb-4">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab('login');
                              setAuthRole('admin');
                              setAuthError('');
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                              authTab === 'login'
                                ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                : 'hover:text-slate-800'
                            }`}
                          >
                            ورود ادمین
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab('signup');
                              setAuthRole('admin');
                              setAuthError('');
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition cursor-pointer ${
                              authTab === 'signup'
                                ? 'bg-white border border-slate-200/60 text-slate-800 shadow-2xs font-extrabold'
                                : 'hover:text-slate-800'
                            }`}
                          >
                            ثبت‌نام ادمین جدید
                          </button>
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 border border-amber-100 text-amber-800 text-center text-xs font-bold p-3.5 rounded-xl mb-4 leading-relaxed animate-fadeIn">
                          مدیر ارشد سیستم قبلاً ثبت‌نام شده است. برای ورود از فرم زیر استفاده کنید.
                        </div>
                      )}

                      {authError && (
                        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black p-3.5 rounded-xl text-center">
                          {authError}
                        </div>
                      )}

                      <form onSubmit={authTab === 'login' ? handleLogin : handleSignup} className="space-y-4">
                        {authTab === 'signup' && (
                          <div className="space-y-1.5 animate-fadeIn">
                            <label className="block text-xs text-slate-700 font-extrabold">نام کامل</label>
                            <input
                              required
                              type="text"
                              placeholder="مثال: مدیر کل سامانه"
                              value={authFullName}
                              onChange={(e) => setAuthFullName(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 outline-none text-xs transition-all duration-200"
                            />
                          </div>
                        )}

                        {authTab === 'signup' && (
                          <div className="space-y-1.5 animate-fadeIn">
                            <label className="block text-xs text-slate-700 font-extrabold">شماره تلفن همراه</label>
                            <input
                              required
                              type="tel"
                              placeholder="مثال: 09123456789"
                              value={authPhoneNumber}
                              onChange={(e) => setAuthPhoneNumber(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 outline-none text-xs text-left transition-all duration-200 font-mono text-slate-800"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-xs text-slate-700 font-extrabold">نام کاربری ادمین</label>
                          <input
                            required
                            type="text"
                            placeholder="نام کاربری به انگلیسی"
                            value={authUsername}
                            onChange={(e) => setAuthUsername(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 outline-none text-xs transition-all duration-200 font-mono text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs text-slate-700 font-extrabold">رمز عبور</label>
                          <input
                            required
                            type="password"
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10 outline-none text-xs transition-all duration-200 font-mono text-left"
                            dir="ltr"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-5"
                        >
                          {authLoading ? 'در حال ارسال...' : authTab === 'login' ? 'ورود به پنل مدیریت کل' : 'ثبت‌نام و ورود'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* Status Banner */}
                  {adminSuccessMessage && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black px-5 py-4 rounded-2xl flex items-center gap-2 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      {adminSuccessMessage}
                    </div>
                  )}
                  {adminError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black px-5 py-4 rounded-2xl flex items-center gap-2 shadow-2xs">
                      <X className="w-5 h-5 text-rose-500" />
                      {adminError}
                    </div>
                  )}

                  {/* STATS OVERVIEW */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    
                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 font-sans">تعداد کل مغازه‌ها</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                          <Store className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{Object.keys(shops).length}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">واحدهای صنفی فعال در سامانه</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 font-sans">تعداد کل نظرات و آرا</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                          <MessageSquare className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{reviews.length}</h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">امتیازات ثبت شده توسط خریداران</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 font-sans">کل کاربران ثبت‌شده</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                          <Users className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">
                          {adminLoadingUsers ? '...' : adminUsers.length || '0'}
                        </h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">مشتریان، مغازه‌داران و مدیران</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 font-sans">میانگین کل امتیازات</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                          <Star className="w-4.5 h-4.5 fill-emerald-500 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">
                          {reviews.length > 0
                            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
                            : '0.0'}
                        </h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">شاخص رضایت خریداران در کل سامانه</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-3.5 col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 font-sans">ادمین‌های فعال سامانه</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                          <Shield className="w-4.5 h-4.5" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <h3 className="text-2xl font-black text-slate-900 leading-none">
                            {adminLoadingUsers ? '...' : adminUsers.filter(u => u.role === 'admin').length}
                          </h3>
                          <span className="text-xs text-slate-400 font-bold">/ ۲ حداکثر</span>
                        </div>
                        <p className="text-[9px] text-purple-600 mt-1 font-black">
                          {adminLoadingUsers ? 'درحال محاسبه...' : `ظرفیت باقیمانده: ${Math.max(0, 2 - adminUsers.filter(u => u.role === 'admin').length)} ادمین`}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* ADMIN MODULES */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Module 1: Shops List */}
                    <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-slate-700" />
                          <h3 className="font-black text-sm text-slate-900">مدیریت مغازه‌ها ({Object.keys(shops).length})</h3>
                        </div>
                      </div>

                      {Object.keys(shops).length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          هیچ مغازه‌ای در سیستم ثبت نشده است.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {Object.entries(shops).map(([id, s]) => {
                            const shopReviews = reviews.filter(r => r.shopId === id);
                            const avg = shopReviews.length > 0
                              ? (shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length).toFixed(1)
                              : '0.0';
                            
                            return (
                              <div key={id} className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
                                <div className="space-y-1 text-right">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-xs text-slate-900">{s.name}</h4>
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold font-mono">ID: {id}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-1 font-bold">{s.address}</p>
                                  <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold mt-1">
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      امتیاز {avg} ({shopReviews.length} نظر)
                                    </span>
                                    <span>•</span>
                                    <span>مالک: {s.owner || 'نامشخص'}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleAdminDeleteShop(id)}
                                  className="w-full sm:w-auto px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1 shrink-0 self-stretch sm:self-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف مغازه
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Module 2: Users List */}
                    <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-slate-700" />
                          <h3 className="font-black text-sm text-slate-900">لیست کاربران سیستم ({adminUsers.length})</h3>
                        </div>
                        <button
                          onClick={fetchAdminUsers}
                          className="text-[9px] text-slate-500 hover:text-slate-900 font-extrabold"
                        >
                          بروزرسانی لیست
                        </button>
                      </div>

                      {/* Admin registration section has been removed as requested */}

                      {adminLoadingUsers ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl">
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin mx-auto mb-2"></div>
                          در حال بارگذاری لیست کاربران...
                        </div>
                      ) : adminUsers.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          هیچ کاربری یافت نشد.
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {(() => {
                            const isCurrentMainAdmin = adminUsers.find(user => user.username.toLowerCase() === currentUser?.username?.toLowerCase())?.isMainAdmin || currentUser?.isMainAdmin;
                            
                            return adminUsers.map((u) => {
                              let badgeStyle = "bg-green-50 text-green-700 border-green-100";
                              let roleName = "خریدار";
                              if (u.role === 'shopkeeper') {
                                badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";
                                roleName = "مغازه‌دار";
                              } else if (u.role === 'admin') {
                                badgeStyle = "bg-purple-50 text-purple-700 border-purple-100";
                                roleName = u.isMainAdmin ? "ادمین اصلی" : "ادمین همکار";
                              }

                              const isSelf = u.username === currentUser?.username;

                              return (
                                <div key={u.username} className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition ${u.isBlocked ? 'bg-red-50/40 border-red-100/60' : 'border-slate-100 hover:bg-slate-50'}`}>
                                  <div className="space-y-1 text-right">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="font-black text-xs text-slate-900 leading-none">{u.fullName}</h4>
                                      <span className={`text-[8px] border px-1.5 py-0.5 rounded-md font-bold ${badgeStyle}`}>
                                        {roleName}
                                      </span>
                                      {u.isBlocked && (
                                        <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 animate-pulse">
                                          🚫 مسدود شده
                                        </span>
                                      )}
                                      {u.isMainAdmin && (
                                        <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                                          👑 مدیر ارشد
                                        </span>
                                      )}
                                      {isSelf && (
                                        <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-md font-bold">
                                          شما
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold font-mono">@{u.username}</p>
                                    {u.phoneNumber && (
                                      <p className="text-[9px] text-slate-500 font-black font-mono leading-none" dir="ltr">
                                        {u.phoneNumber}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {u.role !== 'admin' && isCurrentMainAdmin && (
                                      <button
                                        onClick={() => handleAdminPromoteUser(u.username)}
                                        className="p-1.5 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                                        title="ارتقا به ادمین (فقط مدیر ارشد)"
                                      >
                                        <Shield className="w-4 h-4 text-purple-600" />
                                      </button>
                                    )}
                                    {!isSelf && (
                                      <button
                                        onClick={() => handleAdminToggleBlockUser(u.username, !!u.isBlocked)}
                                        className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${u.isBlocked ? 'hover:bg-emerald-50 text-emerald-600' : 'hover:bg-rose-50 text-rose-600'}`}
                                        title={u.isBlocked ? 'رفع مسدودیت کاربر' : 'مسدود کردن کاربر'}
                                      >
                                        {u.isBlocked ? (
                                          <Unlock className="w-4 h-4" />
                                        ) : (
                                          <Ban className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Module 3: All Reviews & Comments Moderation */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-slate-700" />
                        <h3 className="font-black text-sm text-slate-900 font-sans">مدیریت و تعدیل نظرات ثبت‌شده ({reviews.length})</h3>
                      </div>

                      {/* Tab Filters for reported reviews */}
                      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setAdminOnlyShowReported(false)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            !adminOnlyShowReported
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          همه نظرات ({reviews.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminOnlyShowReported(true)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            adminOnlyShowReported
                              ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                              : 'text-slate-600 hover:text-rose-600'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          گزارش شده ({reviews.filter(r => r.reports && r.reports.length > 0).length})
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const displayedReviews = adminOnlyShowReported
                        ? reviews.filter(r => r.reports && r.reports.length > 0)
                        : reviews;

                      if (displayedReviews.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            {adminOnlyShowReported
                              ? 'هیچ نظر گزارش‌شده‌ای در سیستم یافت نشد.'
                              : 'هیچ نظری در سیستم ثبت نشده است.'}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                          {displayedReviews.map((rev) => {
                            const targetShop = shops[rev.shopId];
                            const isReported = rev.reports && rev.reports.length > 0;

                            return (
                              <div
                                key={rev.id}
                                className={`border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition ${
                                  isReported
                                    ? 'border-rose-100 bg-rose-50/15 hover:bg-rose-50/25'
                                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                }`}
                              >
                                <div className="space-y-2 text-right">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-700 bg-amber-100/60 text-amber-900 px-2 py-0.5 rounded-md font-sans">
                                      به مغازه: {targetShop ? targetShop.name : 'مغازه حذف شده'}
                                    </span>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((starValue) => (
                                        <Star
                                          key={starValue}
                                          className={`w-3 h-3 ${
                                            starValue <= rev.rating
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-700 leading-relaxed font-bold font-sans">
                                    {rev.comment || 'بدون متن...'}
                                  </p>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9px] text-slate-400 font-bold">
                                    <span>توسط: @{rev.username} ({rev.customerName})</span>
                                    <span className="font-mono">{new Date(rev.createdAt).toLocaleDateString('fa-IR')}</span>
                                  </div>

                                  {/* Report Details warning card if reported */}
                                  {isReported && rev.reports && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5 text-xs text-rose-950 space-y-1.5 text-right font-sans mt-2 animate-fadeIn">
                                      <span className="text-[10px] font-black text-rose-800 flex items-center gap-1">
                                        ⚠️ گزارش تخلف ({rev.reports.length}):
                                      </span>
                                      <ul className="space-y-1 divide-y divide-rose-100/60">
                                        {rev.reports.map((rep, idx) => (
                                          <li key={idx} className="pt-1.5 first:pt-0 text-[10px] leading-relaxed">
                                            <span className="font-extrabold text-rose-900">@{rep.reporter}:</span> {rep.reason}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAdminDeleteReview(rev.id)}
                                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    حذف نظر کاربر
                                  </button>

                                  {isReported && (
                                    <button
                                      onClick={() => handleDismissReports(rev.id)}
                                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                                      رد گزارش‌ها
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

            </div>
          )}

        </main>
      )}

      {/* ========================================================= */}
      {/* ================= REGISTER SHOP MODAL =================== */}
      {/* ========================================================= */}
      {showAddShopModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl animate-scaleUp">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5.5 h-5.5 text-amber-400" />
                <h3 className="font-extrabold text-sm md:text-base">ثبت مغازه جدید در سیستم نظرسنجی</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddShopModal(false);
                  setRegisterSuccess(false);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-950 text-lg">مغازه شما با موفقیت ثبت شد!</h4>
                  <p className="text-xs text-slate-500">در حال انتقال و بارگذاری مجدد...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleShopRegister} className="p-6 space-y-5">
                
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">نام مغازه (مثال: هایپرمارکت بهار)</label>
                  <input
                    required
                    type="text"
                    placeholder="نام کامل تجاری یا صنفی خود را وارد کنید"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">کد اختصاصی یا آدرس کوتاه (فقط حروف انگلیسی یا اعداد)</label>
                  <div className="relative" dir="ltr">
                    <input
                      required
                      type="text"
                      placeholder="مثال: bahar-market"
                      value={newShopId}
                      onChange={(e) => setNewShopId(e.target.value)}
                      className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-left transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 text-[10px] font-bold bg-slate-100 px-3 rounded-r-xl border-l border-slate-200">
                      slug
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal text-right">
                    این شناسه در لینک آدرس مغازه شما قرار می‌گیرد. به عنوان مثال: <br/>
                    <code className="text-amber-700 font-mono text-[10px] bg-amber-50 px-1 py-0.5 rounded inline-block mt-1">{window.location.origin}?shop=کد_دلخواه</code>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">آدرس مغازه</label>
                  <input
                    type="text"
                    placeholder="خیابان، میدان، کوچه، پلاک..."
                    value={newShopAddress}
                    onChange={(e) => setNewShopAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">انتخاب موقعیت روی نقشه (کلیک کنید)</label>
                  <div className="w-full h-[180px] rounded-xl overflow-hidden border border-slate-200">
                    <ShopMap
                      address={newShopAddress}
                      lat={registerShopLat}
                      lng={registerShopLng}
                      shopName={newShopName || 'مغازه جدید'}
                      readOnly={false}
                      onLocationSelect={(lat, lng) => {
                        setRegisterShopLat(lat);
                        setRegisterShopLng(lng);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">توضیح کوتاه مغازه (اختیاری)</label>
                  <textarea
                    rows={2}
                    placeholder="صنف فعالیت مغازه یا توضیح کوتاه برای مشتریان..."
                    value={newShopDescription}
                    onChange={(e) => setNewShopDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700">متن تبلیغاتی یا پیشنهاد ویژه (اختیاری)</label>
                  <textarea
                    rows={2}
                    placeholder="مثال: ۱۰٪ تخفیف ویژه خرید نان کنجدی دورو برای ثبت‌کنندگان نظر!"
                    value={newShopPromotion}
                    onChange={(e) => setNewShopPromotion(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                  />
                </div>

                {/* Video section inside Modal */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 mt-2">
                  <span className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-amber-500" />
                    ویدیو یا تیزر تبلیغاتی مغازه
                  </span>

                  {/* Upload from Gallery Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500">بارگذاری فیلم تبلیغاتی از گالری گوشی یا کامپیوتر:</label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-white border border-dashed border-slate-300 hover:border-amber-500 hover:bg-amber-50/20 rounded-xl cursor-pointer transition text-center">
                        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-slate-500" />
                          {uploadingVideo ? 'در حال بارگذاری فیلم...' : 'انتخاب فیلم از گالری'}
                        </span>
                        <input 
                          type="file" 
                          accept="video/*" 
                          onChange={(e) => handleVideoUpload(e, false)} 
                          className="hidden" 
                          disabled={uploadingVideo || !newShopId.trim()}
                        />
                      </label>
                    </div>
                    {!newShopId.trim() && (
                      <p className="text-[9px] font-bold text-amber-600 mt-1">ابتدا فیلد "کد اختصاصی یا آدرس کوتاه" بالا را پر کنید تا بتوانید فیلم گالری را بارگذاری نمایید.</p>
                    )}
                    {uploadError && (
                      <p className="text-[10px] font-extrabold text-red-500 mt-1">{uploadError}</p>
                    )}
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-extrabold">یا انتخاب از ویدیوهای آماده</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <label className="block text-[10px] font-black text-slate-500">انتخاب تیزر پیش‌فرض بر اساس صنف:</label>
                  <select
                    value={newShopPromotionVideo}
                    onChange={(e) => setNewShopPromotionVideo(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                  >
                    {PROMOTION_VIDEO_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                    <option value="custom">آدرس لینک ویدیو سفارشی...</option>
                  </select>

                  {(newShopPromotionVideo === 'custom' || (newShopPromotionVideo && newShopPromotionVideo.startsWith('http') && !newShopPromotionVideo.includes('/uploads/'))) && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="block text-xs font-black text-slate-700">آدرس ویدیو دلخواه (اینترنتی)</label>
                      <input
                        type="text"
                        placeholder="مثال: https://example.com/video.mp4"
                        value={newShopPromotionVideo.startsWith('http') ? newShopPromotionVideo : ''}
                        onChange={(e) => setNewShopPromotionVideo(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs transition-all"
                        dir="ltr"
                      />
                    </div>
                  )}

                  {/* Preview inside registration modal */}
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 aspect-[16/9] relative bg-slate-900">
                    <video 
                      key={newShopPromotionVideo}
                      src={
                        newShopPromotionVideo && (newShopPromotionVideo.startsWith('http') || newShopPromotionVideo.startsWith('/uploads'))
                          ? newShopPromotionVideo
                          : (PROMOTION_VIDEO_PRESETS.find(p => p.id === newShopPromotionVideo)?.url || 'https://assets.mixkit.co/videos/preview/mixkit-paying-by-card-at-a-cash-register-42340-large.mp4')
                      } 
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                    />
                    <div className="absolute bottom-2 right-2 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs pointer-events-none">
                      <span className="text-[9px] text-white font-extrabold">پیش‌نمایش تیزر تبلیغات</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submittingShop}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {submittingShop ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        در حال ثبت...
                      </>
                    ) : (
                      'ثبت و ایجاد کد QR'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddShopModal(false);
                      setRegisterSuccess(false);
                    }}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* NEWLY PROMOTED ADMIN FLOATING TOAST */}
      {newAdminToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-950 text-white rounded-3xl p-5 shadow-2xl border border-purple-900/40 animate-slideUp text-right space-y-4 print:hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <h4 className="font-black text-xs text-purple-300">ارتقای دسترسی به مدیریت کل</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300 font-bold">
                تبریک! حساب کاربری شما توسط مدیریت ارشد به عنوان <span className="text-white font-extrabold underline decoration-purple-400">مدیر کل (ادمین) سیستم</span> ارتقا یافت. هم‌اکنون به تمامی امکانات نظارتی دسترسی دارید.
              </p>
            </div>
            <button 
              onClick={() => setNewAdminToast(false)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setActiveTab('admin');
                setNewAdminToast(false);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm shadow-purple-900/35"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ورود به پنل ادمین
            </button>
            <button
              onClick={() => setNewAdminToast(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-xl transition cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* 3. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 mt-12 border-t border-slate-800 print:hidden">
        <div className="max-w-6xl mx-auto px-4 space-y-1.5 text-xs">
          <p className="font-bold">سامانه ملی امتیازدهی و نظرسنجی مغازه‌ها بر بستر تکنولوژی QR Code</p>
          <p className="opacity-60">تمامی نظرات و امتیازات به طور آنی در سرور ثبت شده و ذخیره‌سازی محلی به صورت امن انجام می‌پذیرد.</p>
        </div>
      </footer>

    </div>
  );
}
