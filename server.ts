import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(_dirname, 'reviews.json');

// Ensure database file exists with initial demo data if empty
function initializeData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      shops: {
        "bahar-market": {
          id: "bahar-market",
          name: "هایپرمارکت بهار",
          address: "تهران، خیابان ولیعصر، نرسیده به میدان ونک",
          description: "عرضه بهترین کالاهای اساسی، میوه و سبزیجات تازه با تخفیف‌های روزانه"
        },
        "saadat-bakery": {
          id: "saadat-bakery",
          name: "نانوایی سنتی سعادت",
          address: "تهران، شهرک غرب، بلوار پاکنژاد",
          description: "انواع نان‌های سنتی سنگک، بربری و تافتون داغ و باکیفیت"
        },
        "shiraz-cafe": {
          id: "shiraz-cafe",
          name: "کافه شیراز",
          address: "شیراز، خیابان ارم، روبروی باغ ارم",
          description: "فضایی دلنشین همراه با منوی متنوع از قهوه‌های تخصصی، دمنوش و کیک‌های روز"
        }
      },
      users: [
        {
          username: "reza",
          password: "123",
          fullName: "رضا کریمی"
        },
        {
          username: "maryam",
          password: "123",
          fullName: "مریم حسینی"
        },
        {
          username: "mohammad",
          password: "123",
          fullName: "محمد علوی"
        },
        {
          username: "sara",
          password: "123",
          fullName: "سارا احمدی"
        },
        {
          username: "aryorad",
          password: "123",
          fullName: "آریوراد طیبا طیبا",
          role: "customer"
        }
      ],
      reviews: [
        {
          id: "rev_1783434913154_7z8o",
          shopId: "saadat-bakery",
          rating: 4,
          comment: "سرعت تحویل نان در این مغازه بسیار کم است و یه ربع تا نیم ساعت باید صبر کنی.",
          customerName: "آریوراد طیبا طیبا",
          username: "aryorad",
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
        },
        {
          id: "r1",
          shopId: "bahar-market",
          rating: 5,
          comment: "همیشه خریدهام رو از اینجا انجام میدم. پرسنل بسیار خوش‌برخورد و قیمت‌ها واقعا منصفانه است.",
          customerName: "رضا کریمی",
          username: "reza",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: "r2",
          shopId: "bahar-market",
          rating: 4,
          comment: "تنوع اجناس عالیه، فقط بعضی اوقات صف صندوق کمی شلوغ میشه.",
          customerName: "مریم حسینی",
          username: "maryam",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: "r3",
          shopId: "saadat-bakery",
          rating: 5,
          comment: "بهترین سنگک منطقه رو پخت میکنن. کنجد دورو با کیفیت عالی و کاملا مغزپخت.",
          customerName: "محمد علوی",
          username: "mohammad",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: "r4",
          shopId: "shiraz-cafe",
          rating: 5,
          comment: "قهوه لاته فوق‌العاده با آرت زیبا و پرسنل صمیمی. فضای بسیار آرامش‌بخشی دارند.",
          customerName: "سارا احمدی",
          username: "sara",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ]
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initializeData();

function readReviews() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { reviews: [], shops: {}, users: [], adminCapacity: 2 };
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    parsed.users = parsed.users || [];
    if (parsed.adminCapacity === undefined) {
      parsed.adminCapacity = 2;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading data file:', e);
    return { reviews: [], shops: {}, users: [], adminCapacity: 2 };
  }
}

function writeReviews(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing data file:', e);
  }
}

async function startServer() {
  const app = express();
  
  // CORS middleware to allow requests from any origin/domain
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(_dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads folder statically
  app.use('/uploads', express.static(uploadsDir));

  // API: Get all reviews and shops (hide passwords)
  app.get('/api/data', (req, res) => {
    const data = readReviews();
    data.users = data.users || [];
    const adminCount = data.users.filter((u: any) => u.role === 'admin').length;
    const safeData = {
      shops: data.shops || {},
      reviews: data.reviews || [],
      adminCapacity: data.adminCapacity || 2,
      adminCount
    };
    res.json(safeData);
  });

  // API: User Signup
  app.post('/api/signup', (req, res) => {
    const { username, password, fullName, role, phoneNumber, requesterUsername } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'تمامی فیلدها (نام کاربری، رمز عبور و نام کامل) الزامی هستند' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'وارد کردن شماره تلفن همراه برای ثبت‌نام الزامی است' });
    }

    const trimmedPhone = phoneNumber.trim();
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ error: 'شماره تلفن همراه وارد شده معتبر نیست. باید با ۰۹ شروع شده و ۱۱ رقم باشد.' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'نام کاربری باید حداقل ۳ کاراکتر باشد' });
    }

    const data = readReviews();
    data.users = data.users || [];

    const existingUser = data.users.find((u: any) => u.username === normalizedUsername);
    if (existingUser) {
      return res.status(400).json({ error: 'این نام کاربری قبلاً ثبت شده است' });
    }

    const existingUserWithPhone = data.users.find((u: any) => u.phoneNumber && u.phoneNumber.trim() === trimmedPhone);
    if (existingUserWithPhone) {
      return res.status(400).json({ error: 'با این شماره تلفن همراه قبلاً یک حساب کاربری ایجاد شده است' });
    }

    if (role === 'admin') {
      const adminCount = data.users.filter((u: any) => u.role === 'admin').length;
      if (adminCount >= 1) {
        // There is already at least one admin. Verify if the signup is performed by the first (Main) Admin.
        const firstAdmin = data.users.find((u: any) => u.role === 'admin');
        const reqUserNormalized = (requesterUsername || '').trim().toLowerCase();
        if (!firstAdmin || firstAdmin.username.toLowerCase() !== reqUserNormalized) {
          return res.status(403).json({ error: 'خطا: ثبت‌نام ادمین جدید فقط توسط مدیر ارشد (اولین ادمین) مجاز است.' });
        }

        const limit = data.adminCapacity || 2;
        if (adminCount >= limit) {
          return res.status(400).json({ error: `خطا: ظرفیت ثبت‌نام ادمین تکمیل است (حداکثر ${limit} ادمین مجاز است)` });
        }
      }
    }

    const newUser = {
      username: normalizedUsername,
      password: password.trim(),
      fullName: fullName.trim(),
      role: role || 'customer',
      phoneNumber: trimmedPhone
    };

    data.users.push(newUser);
    writeReviews(data);

    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const isMainAdmin = firstAdmin && firstAdmin.username.toLowerCase() === newUser.username.toLowerCase();

    res.json({
      success: true,
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        phoneNumber: newUser.phoneNumber,
        isMainAdmin: !!isMainAdmin
      }
    });
  });

  // API: User Login
  app.post('/api/login', (req, res) => {
    const { username, password, role, phoneNumber } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی هستند' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const data = readReviews();
    data.users = data.users || [];

    const user = data.users.find((u: any) => u.username === normalizedUsername && u.password === password.trim());
    if (!user) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'این حساب کاربری مسدود شده است و امکان ورود وجود ندارد.' });
    }

    if (role && user.role && user.role !== role) {
      return res.status(400).json({ error: `این کاربر به عنوان ${role === 'shopkeeper' ? 'مغازه‌دار' : 'خریدار'} ثبت نشده است` });
    }

    // Save/update phone number if logging in as shopkeeper
    if (role === 'shopkeeper' && phoneNumber) {
      user.phoneNumber = phoneNumber.trim();
      writeReviews(data);
    }

    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const isMainAdmin = firstAdmin && firstAdmin.username.toLowerCase() === user.username.toLowerCase();

    res.json({
      success: true,
      user: {
        username: user.username,
        fullName: user.fullName,
        role: user.role || 'customer',
        phoneNumber: user.phoneNumber,
        isMainAdmin: !!isMainAdmin
      }
    });
  });

  // API: Upload video file from gallery (Base64)
  app.post('/api/upload-video', (req, res) => {
    const { videoData, shopId } = req.body;
    if (!videoData || !shopId) {
      return res.status(400).json({ error: 'اطلاعات ارسالی برای بارگذاری ویدیو ناقص است' });
    }

    try {
      // Expect data URI format: data:video/mp4;base64,... or similar
      const match = videoData.match(/^data:(video\/[a-zA-Z0-9.-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'فرمت فایل ارسالی نامعتبر است. لطفاً یک فایل ویدیویی انتخاب کنید.' });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Check file size limit (e.g. 50MB)
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ error: 'حجم ویدیو بسیار زیاد است. حداکثر حجم مجاز ۵۰ مگابایت می‌باشد.' });
      }

      const ext = mimeType.split('/')[1] || 'mp4';
      const fileName = `promo-${shopId}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);

      return res.json({ success: true, url: `/uploads/${fileName}` });
    } catch (error: any) {
      console.error('Error saving uploaded video:', error);
      return res.status(500).json({ error: 'خطایی در ذخیره فایل ویدیو در سرور رخ داد.' });
    }
  });

  // API: Add a shop (Limited to maximum of 1 shop)
  app.post('/api/shops', (req, res) => {
    const { id, name, address, description, promotion, promotionVideo, owner } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'کد مغازه و نام مغازه الزامی هستند' });
    }
    
    // Normalize ID to slug
    const normalizedId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!normalizedId) {
      return res.status(400).json({ error: 'کد مغازه نامعتبر است' });
    }

    const data = readReviews();
    data.shops = data.shops || {};

    // Enforce 1 shop limit
    if (Object.keys(data.shops).length >= 1) {
      return res.status(400).json({ error: 'سیستم نظرسنجی به ثبت تنها یک مغازه محدود شده است. برای ثبت مغازه جدید، ابتدا مغازه قبلی را حذف کنید.' });
    }

    data.shops[normalizedId] = {
      id: normalizedId,
      name: name.trim(),
      address: (address || '').trim(),
      description: (description || '').trim(),
      promotion: (promotion || '').trim(),
      promotionVideo: (promotionVideo || '').trim(),
      owner: (owner || '').trim(),
      lat: req.body.lat !== undefined && req.body.lat !== null ? Number(req.body.lat) : undefined,
      lng: req.body.lng !== undefined && req.body.lng !== null ? Number(req.body.lng) : undefined
    };

    writeReviews(data);
    res.json({ success: true, shop: data.shops[normalizedId] });
  });

  // API: Update a shop (e.g. description, address, promotion)
  app.put('/api/shops/:id', (req, res) => {
    const { id } = req.params;
    const { name, address, description, promotion, promotionVideo, ownerUsername } = req.body;
    
    const data = readReviews();
    data.shops = data.shops || {};
    
    if (data.shops[id]) {
      // Security check: if shop has an owner, verify ownerUsername matches
      if (data.shops[id].owner && data.shops[id].owner !== ownerUsername) {
        return res.status(403).json({ error: 'شما مالک این مغازه نیستید و اجازه ثبت یا ویرایش تبلیغ برای آن را ندارید.' });
      }

      if (name) data.shops[id].name = name.trim();
      if (address !== undefined) data.shops[id].address = (address || '').trim();
      if (description !== undefined) data.shops[id].description = (description || '').trim();
      if (promotion !== undefined) data.shops[id].promotion = (promotion || '').trim();
      if (promotionVideo !== undefined) data.shops[id].promotionVideo = (promotionVideo || '').trim();
      if (req.body.lat !== undefined) data.shops[id].lat = req.body.lat !== null ? Number(req.body.lat) : undefined;
      if (req.body.lng !== undefined) data.shops[id].lng = req.body.lng !== null ? Number(req.body.lng) : undefined;
      
      // Auto-claim owner if not set
      if (!data.shops[id].owner && ownerUsername) {
        data.shops[id].owner = ownerUsername;
      }
      
      writeReviews(data);
      return res.json({ success: true, shop: data.shops[id] });
    }
    res.status(404).json({ error: 'مغازه یافت نشد' });
  });

  // API: Delete a shop
  app.delete('/api/shops/:id', (req, res) => {
    const { id } = req.params;
    const ownerUsername = req.query.ownerUsername as string;
    const requesterRole = req.query.requesterRole as string;
    
    const data = readReviews();
    data.shops = data.shops || {};
    
    if (data.shops[id]) {
      // Security check: if shop has an owner, verify ownerUsername matches unless requested by admin
      if (requesterRole !== 'admin' && data.shops[id].owner && data.shops[id].owner !== ownerUsername) {
        return res.status(403).json({ error: 'شما مالک این مغازه نیستید و اجازه حذف آن را ندارید.' });
      }

      delete data.shops[id];
      // Also clean up reviews for this deleted shop
      if (data.reviews) {
        data.reviews = data.reviews.filter((r: any) => r.shopId !== id);
      }
      writeReviews(data);
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'مغازه یافت نشد' });
  });

  // API: Delete a review (Admin or Shop Owner)
  app.delete('/api/reviews/:id', (req, res) => {
    const { id } = req.params;
    const requesterUsername = req.query.requesterUsername as string;
    const requesterRole = req.query.requesterRole as string;

    const data = readReviews();
    data.reviews = data.reviews || [];

    const reviewIdx = data.reviews.findIndex((r: any) => r.id === id);
    if (reviewIdx === -1) {
      return res.status(404).json({ error: 'نظر مورد نظر یافت نشد' });
    }

    const review = data.reviews[reviewIdx];

    // Check if requester is admin or the owner of the shop
    let allowed = false;
    if (requesterRole === 'admin') {
      allowed = true;
    } else if (requesterUsername) {
      const shop = data.shops && data.shops[review.shopId];
      if (shop && shop.owner === requesterUsername) {
        allowed = true;
      }
    }

    if (!allowed) {
      return res.status(403).json({ error: 'شما اجازه حذف این نظر را ندارید.' });
    }

    data.reviews.splice(reviewIdx, 1);
    writeReviews(data);
    res.json({ success: true });
  });

  // API: Get all users (Admin only)
  app.get('/api/users', (req, res) => {
    const requesterRole = req.query.requesterRole as string;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }
    const data = readReviews();
    data.users = data.users || [];
    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const users = data.users.map((u: any) => ({
      username: u.username,
      fullName: u.fullName,
      role: u.role || 'customer',
      phoneNumber: u.phoneNumber,
      isBlocked: !!u.isBlocked,
      isMainAdmin: firstAdmin && u.username.toLowerCase() === firstAdmin.username.toLowerCase()
    }));
    res.json({ success: true, users });
  });

  // API: Delete a user (Admin only - DISABLED, block user instead)
  app.delete('/api/users/:username', (req, res) => {
    return res.status(403).json({ error: 'امکان حذف کاربر وجود ندارد. شما فقط می‌توانید کاربر را مسدود کنید.' });
  });

  // API: Toggle user blocked status (Admin only)
  app.post('/api/users/:username/toggle-block', (req, res) => {
    const requesterRole = req.query.requesterRole as string;
    const requesterUsername = req.query.requesterUsername as string;
    const { username } = req.params;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }
    const data = readReviews();
    data.users = data.users || [];

    const targetUser = data.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const isTargetMainAdmin = firstAdmin && firstAdmin.username.toLowerCase() === username.toLowerCase();

    if (isTargetMainAdmin) {
      return res.status(400).json({ error: 'مسدود کردن مدیر اصلی (مدیر ارشد) سیستم مجاز نیست.' });
    }

    // If targeting an admin, ensure only the main admin can do it
    if (targetUser.role === 'admin') {
      const isRequesterMainAdmin = firstAdmin && requesterUsername && firstAdmin.username.toLowerCase() === requesterUsername.toLowerCase();
      if (!isRequesterMainAdmin) {
        return res.status(403).json({ error: 'فقط مدیر ارشد (ادمین اصلی) سیستم مجاز به مسدود کردن سایر مدیران است.' });
      }
    }

    targetUser.isBlocked = !targetUser.isBlocked;
    writeReviews(data);
    res.json({ success: true, isBlocked: targetUser.isBlocked });
  });

  // API: Promote a user to admin (Admin only)
  app.post('/api/users/:username/promote', (req, res) => {
    const requesterRole = req.query.requesterRole as string;
    const requesterUsername = req.query.requesterUsername as string;
    const { username } = req.params;
    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: 'دسترسی غیرمجاز' });
    }
    const data = readReviews();
    data.users = data.users || [];

    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const isRequesterMainAdmin = firstAdmin && requesterUsername && firstAdmin.username.toLowerCase() === requesterUsername.toLowerCase();

    if (!isRequesterMainAdmin) {
      return res.status(403).json({ error: 'فقط مدیر ارشد (ادمین اصلی) سیستم می‌تواند دسترسی مدیریت را ارتقا دهد.' });
    }

    const user = data.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'این کاربر در حال حاضر ادمین است' });
    }

    const adminCount = data.users.filter((u: any) => u.role === 'admin').length;
    const limit = data.adminCapacity || 1;
    if (adminCount >= limit) {
      return res.status(400).json({ error: `خطا: ظرفیت ادمین‌های فعال تکمیل است (حداکثر ${limit} ادمین مجاز است)` });
    }

    user.role = 'admin';
    writeReviews(data);
    res.json({ success: true, user: { username: user.username, fullName: user.fullName, role: user.role } });
  });

  // API: Get user status (for real-time role change checking)
  app.get('/api/users/status', (req, res) => {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'نام کاربری الزامی است' });
    }
    const data = readReviews();
    data.users = data.users || [];
    const user = data.users.find((u: any) => u.username.toLowerCase() === (username as string).trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'کاربر یافت نشد' });
    }
    const firstAdmin = data.users.find((u: any) => u.role === 'admin');
    const isMainAdmin = firstAdmin && firstAdmin.username.toLowerCase() === user.username.toLowerCase();
    res.json({
      username: user.username,
      fullName: user.fullName,
      role: user.role || 'customer',
      isBlocked: !!user.isBlocked,
      isMainAdmin: !!isMainAdmin
    });
  });

  // API: Add a review
  app.post('/api/reviews', (req, res) => {
    const { shopId, rating, comment, username } = req.body;
    if (!shopId || !rating || !username) {
      return res.status(400).json({ error: 'اطلاعات ارسالی (کد مغازه، امتیاز و نام کاربری) ناقص است' });
    }

    const score = parseInt(rating, 10);
    if (isNaN(score) || score < 1 || score > 5) {
      return res.status(400).json({ error: 'امتیاز باید بین ۱ تا ۵ باشد' });
    }

    const data = readReviews();
    if (!data.shops || !data.shops[shopId]) {
      return res.status(404).json({ error: 'مغازه مورد نظر یافت نشد' });
    }

    // Verify user exists
    const user = data.users.find((u: any) => u.username === username.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'کاربر معتبر یافت نشد. لطفا مجددا وارد شوید' });
    }

    // Crucial restriction: Check if this user already submitted a review for this shop
    data.reviews = data.reviews || [];
    const alreadyReviewed = data.reviews.some((r: any) => r.shopId === shopId && r.username?.toLowerCase() === username.trim().toLowerCase());
    if (alreadyReviewed) {
      return res.status(400).json({ error: 'شما قبلاً برای این مغازه نظر ثبت کرده‌اید. هر کاربر فقط می‌تواند یک نظر برای هر مغازه ارسال کند.' });
    }

    const newReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      shopId,
      rating: score,
      comment: (comment || '').trim(),
      customerName: user.fullName,
      username: user.username,
      createdAt: new Date().toISOString()
    };

    data.reviews.unshift(newReview); // Newest first

    writeReviews(data);
    res.json({ success: true, review: newReview });
  });

  // API: Like/Unlike a review
  app.post('/api/reviews/:id/like', (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'برای لایک کردن نظر ابتدا باید وارد حساب کاربری خود شوید.' });
    }

    const data = readReviews();
    data.reviews = data.reviews || [];

    const review = data.reviews.find((r: any) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'نظر مورد نظر یافت نشد' });
    }

    review.likes = review.likes || [];
    const normalizedUser = username.trim().toLowerCase();
    const index = review.likes.indexOf(normalizedUser);

    if (index === -1) {
      review.likes.push(normalizedUser);
    } else {
      review.likes.splice(index, 1);
    }

    writeReviews(data);
    res.json({ success: true, likes: review.likes });
  });

  // API: Report a review
  app.post('/api/reviews/:id/report', (req, res) => {
    const { id } = req.params;
    const { username, reason } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'برای گزارش تخلف ابتدا باید وارد حساب کاربری خود شوید.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'لطفا علت گزارش تخلف را وارد کنید.' });
    }

    const data = readReviews();
    data.reviews = data.reviews || [];

    const review = data.reviews.find((r: any) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'نظر مورد نظر یافت نشد' });
    }

    review.reports = review.reports || [];
    const normalizedUser = username.trim().toLowerCase();
    const alreadyReported = review.reports.some((rep: any) => rep.reporter?.toLowerCase() === normalizedUser);
    
    if (alreadyReported) {
      return res.status(400).json({ error: 'شما قبلاً این نظر را گزارش کرده‌اید.' });
    }

    review.reports.push({
      reporter: username.trim(),
      reason: reason.trim(),
      createdAt: new Date().toISOString()
    });

    writeReviews(data);
    res.json({ success: true, reports: review.reports });
  });

  // API: Dismiss reports for a review (Admin only)
  app.post('/api/reviews/:id/dismiss-reports', (req, res) => {
    const { id } = req.params;
    const { requesterRole } = req.body;

    if (requesterRole !== 'admin') {
      return res.status(403).json({ error: 'فقط مدیران سیستم به این بخش دسترسی دارند.' });
    }

    const data = readReviews();
    data.reviews = data.reviews || [];

    const review = data.reviews.find((r: any) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'نظر مورد نظر یافت نشد' });
    }

    review.reports = []; // Clear reports

    writeReviews(data);
    res.json({ success: true });
  });

  // API: Get AI analysis summary for a shop based on its reviews
  app.get('/api/shops/:shopId/ai-summary', async (req, res) => {
    const { shopId } = req.params;

    const data = readReviews();
    const reviewsForShop = (data.reviews || []).filter((r: any) => r.shopId === shopId);

    if (reviewsForShop.length === 0) {
      return res.json({
        hasReviews: false,
        summary: 'هنوز هیچ نظری برای این مغازه ثبت نشده است تا تحلیل هوش مصنوعی روی آن انجام شود.',
        strengths: [],
        weaknesses: [],
        categories: []
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Rule-based smart sentiment analysis fallback so the app runs fully and elegantly
      // even if the user hasn't configured the Gemini API key yet.
      const avgRating = reviewsForShop.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsForShop.length;
      const count = reviewsForShop.length;

      // Extract keywords or sentiments
      const strengthsList: string[] = [];
      const weaknessesList: string[] = [];

      // Logic for strengths
      if (avgRating >= 4.0) {
        strengthsList.push('رضایت کلی بسیار بالا از مغازه و پرسنل');
      }
      
      const commentsConcat = reviewsForShop.map((r: any) => r.comment || '').join(' ');
      
      if (commentsConcat.includes('برخورد') || commentsConcat.includes('پرسنل') || commentsConcat.includes('رفتار') || avgRating >= 3.5) {
        strengthsList.push('برخورد گرم، محترمانه و حرفه‌ای پرسنل با مشتریان');
      } else {
        strengthsList.push('برخورد مناسب پرسنل با مراجعین');
      }

      if (commentsConcat.includes('سریع') || commentsConcat.includes('سرعت') || commentsConcat.includes('زود')) {
        strengthsList.push('سرعت مناسب در ارائه خدمات و تحویل سفارش');
      } else if (avgRating >= 4.2) {
        strengthsList.push('خدمات‌رسانی سریع و بدون معطلی');
      }

      if (commentsConcat.includes('کیفیت') || commentsConcat.includes('عالی') || commentsConcat.includes('خوب')) {
        strengthsList.push('کیفیت بالای محصولات و خدمات ارائه‌شده');
      }

      if (commentsConcat.includes('قیمت') || commentsConcat.includes('منصف') || commentsConcat.includes('ارزان') || commentsConcat.includes('مناسب')) {
        strengthsList.push('قیمت‌گذاری منصفانه و تخفیف‌های جذاب');
      }

      if (strengthsList.length === 0) {
        strengthsList.push('محیط آرام و مناسب برای خرید و سفارش');
      }

      // Logic for weaknesses
      if (commentsConcat.includes('دیر') || commentsConcat.includes('معطل') || commentsConcat.includes('کندی') || commentsConcat.includes('کند')) {
        weaknessesList.push('کندی یا تأخیر جزئی در ارائه خدمات در ساعات شلوغی');
      }
      if (commentsConcat.includes('گران') || commentsConcat.includes('گرون') || commentsConcat.includes('قیمت بالا')) {
        weaknessesList.push('بالا بودن نسبی قیمت برخی اقلام و خدمات');
      }
      if (commentsConcat.includes('برخورد مناسب نیست') || commentsConcat.includes('بداخلاق') || commentsConcat.includes('رفتار مناسب')) {
        weaknessesList.push('نیاز به آموزش بیشتر پرسنل در خصوص مهارت‌های ارتباطی');
      }
      if (avgRating < 3.5) {
        weaknessesList.push('نیاز به بهبود سطح کیفی و تنوع در ارائه محصولات');
      }
      if (weaknessesList.length === 0) {
        weaknessesList.push('پیشنهاد افزایش تنوع محصولات و طرح‌های تشویقی');
        weaknessesList.push('نیاز به هماهنگی بیشتر در ساعات پرتردد مغازه');
      }

      // Categories setup
      const categoriesList = [
        {
          name: 'کیفیت محصولات و خدمات',
          count: Math.max(1, reviewsForShop.filter((r: any) => r.rating >= 4).length),
          sentiment: avgRating >= 3.8 ? 'مثبت' : avgRating >= 2.8 ? 'خنثی' : 'منفی',
          description: 'بررسی سطح کیفی کالاها و رضایت عمومی مشتریان از کیفیت خرید.'
        },
        {
          name: 'برخورد و رفتار پرسنل',
          count: Math.max(1, reviewsForShop.filter((r: any) => (r.comment || '').match(/برخورد|رفتار|پرسنل|مشتری|مدیر/)).length),
          sentiment: avgRating >= 3.5 ? 'مثبت' : 'خنثی',
          description: 'میزان صمیمیت، تعهد و پاسخگویی کادر فروش به خریداران.'
        },
        {
          name: 'قیمت‌گذاری و ارزش خرید',
          count: Math.max(1, reviewsForShop.filter((r: any) => (r.comment || '').match(/قیمت|هزینه|تخفیف|ارزان|گران/)).length),
          sentiment: commentsConcat.includes('گران') ? 'منفی' : 'مثبت',
          description: 'تناسب هزینه‌های پرداختی با ارزش و کیفیت دریافتی.'
        }
      ];

      const localSummary = `[تحلیل محلی] بر اساس تحلیل محلی ${count} نظر ثبت شده، این مغازه دارای میانگین امتیاز ${avgRating.toFixed(1)} از ۵ است. مشتریان عمدتاً از "${strengthsList[0] || 'کیفیت مناسب خدمات'}" اعلام رضایت کرده‌اند. جهت ارتقای هر چه بیشتر برند، توجه به "${weaknessesList[0]}" پیشنهاد می‌گردد. (توجه: برای تحلیل پیشرفته‌تر با هوش مصنوعی Gemini زنده، لطفاً کلید GEMINI_API_KEY را در تنظیمات Secrets تعریف کنید)`;

      return res.json({
        hasReviews: true,
        summary: localSummary,
        strengths: strengthsList.slice(0, 4),
        weaknesses: weaknessesList.slice(0, 4),
        categories: categoriesList
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const reviewsText = reviewsForShop
        .map((r: any, idx: number) => `Review #${idx + 1}: Rating: ${r.rating}/5. Comment: "${r.comment}"`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `شما یک سیستم پیشرفته تحلیل نظرات کاربران در یک برنامه ایرانی هستید. نظرات زیر که برای یک مغازه ثبت شده‌اند را تحلیل کنید و خروجی ساختاریافته به زبان فارسی بازگردانید. تمام متن خروجی باید کاملا فارسی، روان و مناسب برای مغازه‌دار باشد.\n\nنظرات:\n${reviewsText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'یک خلاصه بسیار روان و جذاب از برآیند کلی نظرات کاربران به زبان فارسی.',
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'حداکثر ۴ مورد از مهم‌ترین نقاط قوت مغازه که کاربران در نظرات به آن اشاره کرده‌اند (به زبان فارسی).',
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'حداکثر ۴ مورد از نقاط ضعف یا موارد نیازمند بهبود مغازه بر اساس نظرات (به زبان فارسی).',
              },
              categories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'نام دسته‌بندی به فارسی (مثلا: "کیفیت محصولات"، "برخورد کارکنان"، "سرعت خدمات"، "قیمت‌گذاری"، "محیط و پاکیزگی").',
                    },
                    count: {
                      type: Type.INTEGER,
                      description: 'تعداد تقریبی نظراتی که به این موضوع اشاره کرده‌اند یا در این دسته‌بندی جای می‌گیرند.',
                    },
                    sentiment: {
                      type: Type.STRING,
                      description: 'حس غالب کاربران در این دسته‌بندی که دقیقا باید یکی از این سه مقدار باشد: "مثبت" یا "منفی" یا "خنثی".',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'یک توضیح کوتاه فارسی درباره نظر کلی کاربران نسبت به این موضوع در این مغازه.',
                    }
                  },
                  required: ['name', 'count', 'sentiment', 'description']
                },
                description: 'دسته‌بندی خودکار نظرات کاربران به دسته‌های مختلف موضوعی.',
              }
            },
            required: ['summary', 'strengths', 'weaknesses', 'categories']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedAnalysis = JSON.parse(responseText);

      res.json({
        hasReviews: true,
        ...parsedAnalysis
      });
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      res.status(500).json({
        error: 'خطا در برقراری ارتباط با هوش مصنوعی برای تحلیل نظرات. لطفا مجدداً تلاش کنید.',
        details: error.message
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // In development, integrate Vite in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(_dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, serve the compiled build assets
    app.use(express.static(path.join(_dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(_dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
