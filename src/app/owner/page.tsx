// src/app/owner/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, ClipboardList, ImageIcon, PlusCircle, Trash2, Edit2, 
  MapPin, Users, Maximize2, Sparkles, Check, ChevronLeft, UploadCloud, X, ArrowLeft, ShieldAlert, Star,
  Mail, Phone, User, Lock, Loader2, Plus, Clock
} from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser, AuthUser, loginAs, loginWithProfile } from '@/lib/auth';
import { supabase, BoardingHouse, RoomType, BoardingHouseImage, RoomTypeImage, UserProfile } from '@/lib/supabase';
import Link from 'next/link';
import { saveImageToIDB, getImageFromIDB, isIDBRef, compressImage } from '@/lib/image-store';
import { IDBImage } from '@/components/idb-image';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-60 bg-gray-50 animate-pulse flex items-center justify-center text-xs font-bold text-gray-400 rounded-2xl border">
      Đang tải bản đồ chọn vị trí...
    </div>
  ),
});

export default function OwnerDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'houses' | 'roomTypes'>('houses');
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  // Database Data States
  const [myHouses, setMyHouses] = useState<BoardingHouse[]>([]);
  const [myRoomTypes, setMyRoomTypes] = useState<RoomType[]>([]);
  const [pendingImagesCount, setPendingImagesCount] = useState(0);

  // Forms / Actions State
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<BoardingHouse | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<{ type: 'house' | 'room'; id: number } | null>(null);

  // Bulk Room Types Editor Modal State
  const [showBulkRoomModal, setShowBulkRoomModal] = useState<{ houseId: number } | null>(null);
  const [bulkRooms, setBulkRooms] = useState<(RoomType & { images?: (Omit<RoomTypeImage, 'id' | 'created_at'> & { id?: number })[] })[]>([]);
  const [expandedRoomId, setExpandedRoomId] = useState<number | string | null>(null);
  const [roomsToDelete, setRoomsToDelete] = useState<number[]>([]);

  // House Form Inputs
  const [houseName, setHouseName] = useState('');
  const [houseAddress, setHouseAddress] = useState('');
  const [houseZone, setHouseZone] = useState('');
  const [houseDesc, setHouseDesc] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [houseLat, setHouseLat] = useState('21.0125');
  const [houseLng, setHouseLng] = useState('105.5269');

  // Room Form Inputs
  const [selectedHouseId, setSelectedHouseId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomArea, setRoomArea] = useState('');
  const [roomMaxPeople, setRoomMaxPeople] = useState('2');
  const [roomDesc, setRoomDesc] = useState('');
  const [roomUtilities, setRoomUtilities] = useState<string[]>([]);
  const [roomVideo, setRoomVideo] = useState('');
  const [roomServiceFee, setRoomServiceFee] = useState('0');
  const [roomElectricityPrice, setRoomElectricityPrice] = useState('3500');

  // Image Upload Inputs
  const [uploadType, setUploadType] = useState<string>('1');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFilePreview, setUploadFilePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // States for room type image management inside the add/edit form
  const [formRoomImages, setFormRoomImages] = useState<(Omit<RoomTypeImage, 'id' | 'created_at'> & { id?: number })[]>([]);
  const [roomUploadMode, setRoomUploadMode] = useState<'file' | 'url'>('file');
  const [roomFormUrlInput, setRoomFormUrlInput] = useState('');
  const [isRoomFormDragOver, setIsRoomFormDragOver] = useState(false);
  const [bulkDragOverRoomId, setBulkDragOverRoomId] = useState<number | string | null>(null);

  // Registration & Auth States
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'pending' | 'rejected'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [pendingName, setPendingName] = useState('');

  // Mock Google Authentication Dialog States
  const [showMockGoogleModal, setShowMockGoogleModal] = useState(false);
  const [mockGoogleMode, setMockGoogleMode] = useState<'login' | 'register'>('login');
  const [mockGoogleEmail, setMockGoogleEmail] = useState('');
  const [mockGoogleName, setMockGoogleName] = useState('');
  const [mockGooglePhone, setMockGooglePhone] = useState('');
  const [mockGoogleAccounts, setMockGoogleAccounts] = useState<UserProfile[]>([]);

  // Physical Rooms states (Single & Bulk)
  const [formRooms, setFormRooms] = useState<{ name: string; available: boolean }[]>([]);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [bulkNewRoomInput, setBulkNewRoomInput] = useState<{ [roomId: string | number]: string }>({});

  // Uploader Modal active images states
  const [modalImagesBh, setModalImagesBh] = useState<BoardingHouseImage[]>([]);
  const [modalImagesRt, setModalImagesRt] = useState<RoomTypeImage[]>([]);

  // Utilities available to check
  const [customUtilities, setCustomUtilities] = useState<string[]>([
    'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt', 'Bếp nấu ăn', 'Sofa', 'Kệ tivi', 'Ban công', 'Wifi', 'Khóa vân tay', 'Giờ giấc tự do'
  ]);
  const [newUtilityInput, setNewUtilityInput] = useState('');
  const [bulkNewUtilityInput, setBulkNewUtilityInput] = useState<{ [roomId: string | number]: string }>({});

  const handleAddNewUtility = () => {
    const trimmed = newUtilityInput.trim();
    if (!trimmed) return;
    if (!customUtilities.includes(trimmed)) {
      setCustomUtilities(prev => [...prev, trimmed]);
    }
    if (!roomUtilities.includes(trimmed)) {
      setRoomUtilities(prev => [...prev, trimmed]);
    }
    setNewUtilityInput('');
  };

  const handleAddNewUtilityBulk = (roomId: number | string) => {
    const inputVal = bulkNewUtilityInput[roomId] || '';
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    
    if (!customUtilities.includes(trimmed)) {
      setCustomUtilities(prev => [...prev, trimmed]);
    }
    
    setBulkRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const currentUtilities = room.utilities || [];
        if (!currentUtilities.includes(trimmed)) {
          return { ...room, utilities: [...currentUtilities, trimmed] };
        }
      }
      return room;
    }));
    
    setBulkNewUtilityInput(prev => ({ ...prev, [roomId]: '' }));
  };

  // --- PHYSICAL ROOMS HANDLERS (SINGLE FORM) ---
  const handleSingleAddPhysicalRoom = () => {
    const trimmed = newRoomInput.trim();
    if (!trimmed) return;
    if (formRooms.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Tên phòng này đã tồn tại!');
      return;
    }
    setFormRooms(prev => [...prev, { name: trimmed, available: true }]);
    setNewRoomInput('');
  };

  const handleSingleTogglePhysicalRoomAvailability = (pRoomIdx: number) => {
    setFormRooms(prev => prev.map((r, i) => i === pRoomIdx ? { ...r, available: !r.available } : r));
  };

  const handleSingleRemovePhysicalRoom = (pRoomIdx: number) => {
    setFormRooms(prev => prev.filter((_, i) => i !== pRoomIdx));
  };

  // --- PHYSICAL ROOMS HANDLERS (BULK EDIT) ---
  const handleAddPhysicalRoomBulk = (roomId: number | string) => {
    const inputVal = bulkNewRoomInput[roomId] || '';
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    
    setBulkRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const currentRooms = room.rooms || [];
        if (currentRooms.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
          alert('Tên phòng này đã tồn tại!');
          return room;
        }
        return { 
          ...room, 
          rooms: [...currentRooms, { name: trimmed, available: true }] 
        };
      }
      return room;
    }));
    
    setBulkNewRoomInput(prev => ({ ...prev, [roomId]: '' }));
  };

  const handleTogglePhysicalRoomAvailability = (roomId: number | string, pRoomIdx: number) => {
    setBulkRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const currentRooms = [...(room.rooms || [])];
        if (currentRooms[pRoomIdx]) {
          currentRooms[pRoomIdx] = {
            ...currentRooms[pRoomIdx],
            available: !currentRooms[pRoomIdx].available
          };
        }
        return { ...room, rooms: currentRooms };
      }
      return room;
    }));
  };

  const handleRemovePhysicalRoomBulk = (roomId: number | string, pRoomIdx: number) => {
    setBulkRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        const currentRooms = (room.rooms || []).filter((_, idx) => idx !== pRoomIdx);
        return { ...room, rooms: currentRooms };
      }
      return room;
    }));
  };

  const loadModalImages = async () => {
    if (!showUploadForm) {
      setModalImagesBh([]);
      setModalImagesRt([]);
      return;
    }
    try {
      if (showUploadForm.type === 'house') {
        const imgs = await db.getBoardingHouseImages(showUploadForm.id);
        setModalImagesBh(imgs);
      } else {
        const imgs = await db.getRoomTypeImages(showUploadForm.id);
        setModalImagesRt(imgs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadModalImages();
  }, [showUploadForm]);
  useEffect(() => {
    // Check URL parameters for OAuth errors
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      if (error) {
        alert(`Đăng nhập Google thất bại: ${errorDescription || error}\n(Có thể do bạn chưa cấu hình hoặc cấu hình sai Google Auth Client ID/Secret trên Dashboard Supabase)`);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    // Read current session on mount (instead of logging out)
    const user = getCurrentUser();

    const checkGoogleUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const user = session.user;
          const email = user.email || '';
          
          let profile = await db.getProfileByEmail(email);
          if (!profile) {
            const newProfile: UserProfile = {
              id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
              phone: user.phone || user.user_metadata?.phone || '09xxxxxxxx',
              email: email,
              role: 'owner',
              status: 'pending',
              created_at: new Date().toISOString()
            };
            await db.createOwnerProfile(newProfile);
            profile = newProfile;
          }

          if (profile.status === 'pending') {
            setPendingName(profile.name);
            setAuthMode('pending');
            loginAs('guest'); // Clear local session!
            await supabase.auth.signOut();
            return;
          }

          if (profile.status === 'rejected') {
            setPendingName(profile.name);
            setAuthMode('rejected');
            loginAs('guest'); // Clear local session!
            await supabase.auth.signOut();
            return;
          }

          if (profile.status === 'active') {
            const activeUser = {
              id: profile.id,
              name: profile.name,
              phone: profile.phone || '',
              email: profile.email,
              role: 'owner' as const,
              status: 'active' as const
            };
            loginWithProfile(activeUser);
            setCurrentUser(activeUser);
          }
        } else {
          // No Google session, load demo user from LocalStorage
          if (user && user.role === 'owner') {
            setCurrentUser(user);
          } else {
            loginAs('guest');
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('Error checking Google session:', err);
        // Fallback to demo user
        if (user && user.role === 'owner') {
          setCurrentUser(user);
        } else {
          loginAs('guest');
          setCurrentUser(null);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkGoogleUser();

    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);
  const loadOwnerData = async () => {
    if (isCheckingAuth) return;
    if (!currentUser || currentUser.role !== 'owner') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch houses owned by me
      const houses = await db.getBoardingHouses({ owner_id: currentUser.id });
      setMyHouses(houses);

      // Fetch all room types and filter by my houses
      const houseIds = houses.map(h => h.id);
      const allRoomTypes = await db.getRoomTypes();
      const filteredRoomTypes = allRoomTypes.filter(rt => houseIds.includes(rt.boarding_house_id));
      setMyRoomTypes(filteredRoomTypes);

      // Extract custom utilities from existing room types
      const existingUtils = new Set<string>();
      filteredRoomTypes.forEach(rt => {
        if (rt.utilities) {
          rt.utilities.forEach(ut => existingUtils.add(ut));
        }
      });
      const defaultUtils = [
        'Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt',
        'Bếp tách riêng', 'Bếp chung', 'Bếp nấu ăn',
        'Sofa', 'Kệ tivi', 'Ban công',
        'Wifi', 'Khóa vân tay', 'Cửa khóa thẻ từ',
        'Gửi xe', 'Camera an ninh', 'Sân phơi đồ',
        'Thang máy', 'Vệ sinh khép kín', 'Giờ giấc tự do',
        'Nội thất cơ bản', 'Nội thất đầy đủ',
      ];
      const mergedUtils = Array.from(new Set([...defaultUtils, ...Array.from(existingUtils)]));
      setCustomUtilities(mergedUtils);

      // Get count of pending images for my items
      const { boardingHouseImages, roomTypeImages } = await db.getPendingImages();
      const myPendingBh = boardingHouseImages.filter(img => houseIds.includes(img.boarding_house_id)).length;
      const myPendingRt = roomTypeImages.filter(img => filteredRoomTypes.map(rt => rt.id).includes(img.room_type_id)).length;
      setPendingImagesCount(myPendingBh + myPendingRt);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [currentUser, isCheckingAuth]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'owner') {
      const dismissed = localStorage.getItem(`dismissed_approval_${currentUser.id}`);
      if (dismissed !== 'true') {
        setShowApprovalAlert(true);
      }
    } else {
      setShowApprovalAlert(false);
    }
  }, [currentUser]);


  // --- HOUSE ACTIONS ---
  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !houseName || !houseAddress || !houseZone) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc, bao gồm cả Khu vực!');
      return;
    }

    try {
      const finalAddress = `${houseAddress.trim()}, ${houseZone}`;
      const houseData = {
        owner_id: currentUser.id,
        name: houseName,
        address: finalAddress,
        description: houseDesc,
        rules: houseRules,
        latitude: Number(houseLat),
        longitude: Number(houseLng)
      };

      if (editingHouse) {
        await db.updateBoardingHouse(editingHouse.id, houseData);
      } else {
        await db.createBoardingHouse(houseData);
      }

      // Close and Reset
      setShowHouseForm(false);
      setEditingHouse(null);
      setHouseName('');
      setHouseAddress('');
      setHouseZone('');
      setHouseDesc('');
      setHouseRules('');
      await loadOwnerData();
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu nhà trọ.');
    }
  };

  const handleEditHouse = (house: BoardingHouse) => {
    setEditingHouse(house);
    setHouseName(house.name);
    
    // Parse address and zone
    const zones = ['Thạch Hòa', 'Tân Xã', 'Bình Yên', 'Sơn Tây', 'Hạ Bằng', 'Bắc Phú Cát', 'Phú Hữu'];
    const detectedZone = zones.find(z => house.address.endsWith(`, ${z}`));
    if (detectedZone) {
      setHouseZone(detectedZone);
      setHouseAddress(house.address.slice(0, -(detectedZone.length + 2)));
    } else {
      setHouseZone('');
      setHouseAddress(house.address);
    }

    setHouseDesc(house.description || '');
    setHouseRules(house.rules || '');
    setHouseLat((house.latitude || 21.0125).toString());
    setHouseLng((house.longitude || 105.5269).toString());
    setShowHouseForm(true);
  };

  const handleDeleteHouse = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa tòa nhà này? Mọi phòng trọ và ảnh liên quan sẽ bị xóa!')) {
      await db.deleteBoardingHouse(id);
      await loadOwnerData();
    }
  };

  // --- ROOM IMAGE UPLOADER HELPERS FOR FORM ---
  const processRoomFiles = async (files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.');
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const compressed = await compressImage(base64);
          const finalUrl = await saveImageToIDB(compressed);
          setFormRoomImages(prev => {
            const hasMain = prev.some(img => img.image_type === 'main');
            return [...prev, {
              room_type_id: editingRoom ? editingRoom.id : 0,
              image_url: finalUrl,
              image_type: hasMain ? 'bedroom' : 'main',
              status: 'approved',
              sort_order: prev.length + 1
            }];
          });
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRoomFormFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processRoomFiles(files);
    if (e.target) e.target.value = ''; // Reset input to allow re-selection
  };

  const handleRoomFormAddUrl = () => {
    if (!roomFormUrlInput) return;
    setFormRoomImages(prev => {
      const hasMain = prev.some(img => img.image_type === 'main');
      return [...prev, {
        room_type_id: editingRoom ? editingRoom.id : 0,
        image_url: roomFormUrlInput,
        image_type: hasMain ? 'bedroom' : 'main',
        status: 'approved',
        sort_order: prev.length + 1
      }];
    });
    setRoomFormUrlInput('');
  };

  const handleRoomFormAddMockup = () => {
    const mockups = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
    ];
    const random = mockups[Math.floor(Math.random() * mockups.length)];
    setFormRoomImages(prev => {
      const hasMain = prev.some(img => img.image_type === 'main');
      return [...prev, {
        room_type_id: editingRoom ? editingRoom.id : 0,
        image_url: random,
        image_type: hasMain ? 'bedroom' : 'main',
        status: 'approved',
        sort_order: prev.length + 1
      }];
    });
  };

  const handleRoomFormRemoveImage = (idx: number) => {
    setFormRoomImages(prev => {
      const itemToRemove = prev[idx];
      const next = prev.filter((_, i) => i !== idx);
      if (itemToRemove.image_type === 'main' && next.length > 0) {
        next[0].image_type = 'main';
      }
      return next.map((img, i) => ({ ...img, sort_order: i + 1 }));
    });
  };

  const handleRoomFormSetMain = (idx: number) => {
    setFormRoomImages(prev => {
      return prev.map((img, i) => {
        if (i === idx) {
          return { ...img, image_type: 'main', sort_order: 1 };
        }
        return {
          ...img,
          image_type: img.image_type === 'main' ? 'bedroom' : img.image_type,
          sort_order: img.sort_order <= 1 ? img.sort_order + 1 : img.sort_order
        };
      });
    });
  };

  // --- ROOM ACTIONS ---
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseId || !roomName || !roomPrice || !roomArea) return;

    try {
      const roomData = {
        boarding_house_id: Number(selectedHouseId),
        name: roomName,
        price_from: Number(roomPrice),
        service_fee: Number(roomServiceFee),
        electricity_price: Number(roomElectricityPrice),
        area: Number(roomArea),
        max_people: Number(roomMaxPeople),
        description: roomDesc,
        utilities: roomUtilities,
        video_url: roomVideo,
        rooms: formRooms
      };

      let savedRoom: RoomType;
      if (editingRoom) {
        savedRoom = await db.updateRoomType(editingRoom.id, roomData);
      } else {
        savedRoom = await db.createRoomType(roomData);
      }

      // Sync room images
      const dbImages = await db.getRoomTypeImages(savedRoom.id);
      
      // Delete images that are no longer in formRoomImages
      for (const dbImg of dbImages) {
        const stillExists = formRoomImages.some(fImg => (fImg as any).id === dbImg.id);
        if (!stillExists) {
          await db.deleteRoomTypeImage(dbImg.id);
        }
      }

      // Save/update images in formRoomImages
      for (const fImg of formRoomImages) {
        if ((fImg as any).id) {
          // Update existing image
          await db.updateRoomTypeImage((fImg as any).id, {
            image_type: fImg.image_type as any,
            sort_order: fImg.sort_order
          });
        } else {
          // Create new image
          await db.addRoomTypeImage({
            room_type_id: savedRoom.id,
            image_url: fImg.image_url,
            image_type: fImg.image_type as any,
            status: 'approved',
            sort_order: fImg.sort_order
          });
        }
      }

      setShowRoomForm(false);
      setEditingRoom(null);
      setRoomName('');
      setRoomPrice('');
      setRoomArea('');
      setRoomDesc('');
      setRoomUtilities([]);
      setRoomVideo('');
      setRoomServiceFee('0');
      setRoomElectricityPrice('3500');
      setFormRoomImages([]);
      setRoomUploadMode('file');
      setRoomFormUrlInput('');
      setFormRooms([]);
      setNewRoomInput('');
      await loadOwnerData();
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu loại phòng.');
    }
  };

  const handleEditRoom = async (room: RoomType) => {
    setEditingRoom(room);
    setSelectedHouseId(room.boarding_house_id.toString());
    setRoomName(room.name);
    setRoomPrice(room.price_from.toString());
    setRoomArea(room.area.toString());
    setRoomMaxPeople(room.max_people.toString());
    setRoomDesc(room.description || '');
    setRoomUtilities(room.utilities || []);
    setRoomVideo(room.video_url || '');
    setRoomServiceFee((room.service_fee ?? 0).toString());
    setRoomElectricityPrice((room.electricity_price ?? 3500).toString());
    setFormRooms(room.rooms || []);
    setNewRoomInput('');

    // Load room images
    try {
      const imgs = await db.getRoomTypeImages(room.id);
      setFormRoomImages(imgs);
    } catch (err) {
      console.error(err);
      setFormRoomImages([]);
    }

    setRoomUploadMode('file');
    setRoomFormUrlInput('');
    setShowRoomForm(true);
  };

  const handleDeleteRoom = async (id: number) => {
    if (confirm('Bạn có chắc muốn xóa loại phòng này? Mọi ảnh liên quan sẽ bị xóa.')) {
      await db.deleteRoomType(id);
      await loadOwnerData();
    }
  };

  const handleUtilityToggle = (ut: string) => {
    if (roomUtilities.includes(ut)) {
      setRoomUtilities(roomUtilities.filter(u => u !== ut));
    } else {
      setRoomUtilities([...roomUtilities, ut]);
    }
  };

  // --- BULK ROOM ACTIONS ---
  const handleOpenBulkRoomModal = async (houseId: number) => {
    setLoading(true);
    try {
      const rooms = myRoomTypes.filter(rt => rt.boarding_house_id === houseId);
      const roomsWithImages = await Promise.all(rooms.map(async (room) => {
        const imgs = await db.getRoomTypeImages(room.id);
        return { ...room, images: imgs };
      }));
      setBulkRooms(roomsWithImages);
      setRoomsToDelete([]);
      setExpandedRoomId(null);
      setShowBulkRoomModal({ houseId });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBulkRoomRow = () => {
    if (!showBulkRoomModal) return;
    const tempId = `temp-${Date.now()}`;
    const newRoom = {
      id: tempId as any,
      boarding_house_id: showBulkRoomModal.houseId,
      name: 'Kiểu phòng mới',
      price_from: 3000000,
      service_fee: 0,
      electricity_price: 3500,
      area: 25,
      max_people: 2,
      description: 'Mô tả chi tiết phòng trọ mới...',
      utilities: ['Wifi'],
      video_url: '',
      images: [],
      created_at: new Date().toISOString()
    };
    setBulkRooms([...bulkRooms, newRoom as any]);
    setExpandedRoomId(tempId);
  };

  const processBulkRoomFiles = async (roomId: number | string, files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.');
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const compressed = await compressImage(base64);
          const finalUrl = await saveImageToIDB(compressed);
          setBulkRooms(prev => prev.map(r => {
            if (r.id === roomId) {
              const currentImages = (r as any).images || [];
              const hasMain = currentImages.some((img: any) => img.image_type === 'main');
              return {
                ...r,
                images: [...currentImages, {
                  room_type_id: typeof roomId === 'number' ? roomId : 0,
                  image_url: finalUrl,
                  image_type: hasMain ? 'bedroom' : 'main',
                  status: 'approved',
                  sort_order: currentImages.length + 1
                }]
              };
            }
            return r;
          }));
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkRoomFileChange = async (roomId: number | string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processBulkRoomFiles(roomId, files);
  };

  const handleBulkRoomAddUrl = (roomId: number | string, url: string) => {
    if (!url) return;
    setBulkRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentImages = (r as any).images || [];
        const hasMain = currentImages.some((img: any) => img.image_type === 'main');
        return {
          ...r,
          images: [...currentImages, {
            room_type_id: typeof roomId === 'number' ? roomId : 0,
            image_url: url,
            image_type: hasMain ? 'bedroom' : 'main',
            status: 'approved',
            sort_order: currentImages.length + 1
          }]
        };
      }
      return r;
    }));
  };

  const handleBulkRoomAddMockup = (roomId: number | string) => {
    const mockups = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7eaa511?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
    ];
    const random = mockups[Math.floor(Math.random() * mockups.length)];
    setBulkRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentImages = (r as any).images || [];
        const hasMain = currentImages.some((img: any) => img.image_type === 'main');
        return {
          ...r,
          images: [...currentImages, {
            room_type_id: typeof roomId === 'number' ? roomId : 0,
            image_url: random,
            image_type: hasMain ? 'bedroom' : 'main',
            status: 'approved',
            sort_order: currentImages.length + 1
          }]
        };
      }
      return r;
    }));
  };

  const handleBulkRoomRemoveImage = (roomId: number | string, imgIdx: number) => {
    setBulkRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentImages = (r as any).images || [];
        const itemToRemove = currentImages[imgIdx];
        const next = currentImages.filter((_: any, i: number) => i !== imgIdx);
        if (itemToRemove.image_type === 'main' && next.length > 0) {
          next[0].image_type = 'main';
        }
        return {
          ...r,
          images: next.map((img: any, i: number) => ({ ...img, sort_order: i + 1 }))
        };
      }
      return r;
    }));
  };

  const handleBulkRoomSetMain = (roomId: number | string, imgIdx: number) => {
    setBulkRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentImages = (r as any).images || [];
        const updatedImages = currentImages.map((img: any, i: number) => {
          if (i === imgIdx) {
            return { ...img, image_type: 'main', sort_order: 1 };
          }
          return {
            ...img,
            image_type: img.image_type === 'main' ? 'bedroom' : img.image_type,
            sort_order: img.sort_order <= 1 ? img.sort_order + 1 : img.sort_order
          };
        });
        return { ...r, images: updatedImages };
      }
      return r;
    }));
  };

  const handleUpdateBulkRoomField = (id: number | string, field: keyof RoomType, value: any) => {
    setBulkRooms(bulkRooms.map(room => {
      if (room.id === id) {
        return { ...room, [field]: value };
      }
      return room;
    }));
  };

  const handleToggleBulkRoomUtility = (id: number | string, utility: string) => {
    setBulkRooms(bulkRooms.map(room => {
      if (room.id === id) {
        const currentUtilities = room.utilities || [];
        const newUtilities = currentUtilities.includes(utility)
          ? currentUtilities.filter(u => u !== utility)
          : [...currentUtilities, utility];
        return { ...room, utilities: newUtilities };
      }
      return room;
    }));
  };

  const handleDeleteBulkRoomRow = (id: number | string) => {
    if (confirm('Bạn có chắc chắn muốn xóa kiểu phòng này không?')) {
      if (typeof id === 'number') {
        setRoomsToDelete([...roomsToDelete, id]);
      }
      setBulkRooms(bulkRooms.filter(room => room.id !== id));
      if (expandedRoomId === id) setExpandedRoomId(null);
    }
  };

  const handleSaveBulkRoomsAll = async () => {
    if (!showBulkRoomModal) return;
    setLoading(true);
    try {
      // 1. Delete rooms marked for deletion
      for (const id of roomsToDelete) {
        await db.deleteRoomType(id);
      }

      // 2. Create or update remaining rooms
      for (const room of bulkRooms) {
        const isTemp = typeof (room.id as any) === 'string' && (room.id as any).startsWith('temp-');
        
        const roomData = {
          boarding_house_id: room.boarding_house_id,
          name: room.name,
          price_from: Number(room.price_from),
          service_fee: Number(room.service_fee || 0),
          electricity_price: Number(room.electricity_price || 3500),
          area: Number(room.area),
          max_people: Number(room.max_people),
          description: room.description || '',
          utilities: room.utilities || [],
          video_url: room.video_url || '',
          rooms: room.rooms || []
        };

        let savedRoom: RoomType;
        if (isTemp) {
          savedRoom = await db.createRoomType(roomData);
        } else {
          savedRoom = await db.updateRoomType(Number(room.id), roomData);
        }

        // Sync images for this specific room
        const roomImages = (room as any).images || [];
        const dbImages = await db.getRoomTypeImages(savedRoom.id);
        
        // Delete removed images
        for (const dbImg of dbImages) {
          const stillExists = roomImages.some((rImg: any) => rImg.id === dbImg.id);
          if (!stillExists) {
            await db.deleteRoomTypeImage(dbImg.id);
          }
        }

        // Save new or updated images
        for (const rImg of roomImages) {
          if (rImg.id) {
            await db.updateRoomTypeImage(rImg.id, {
              image_type: rImg.image_type,
              sort_order: rImg.sort_order
            });
          } else {
            await db.addRoomTypeImage({
              room_type_id: savedRoom.id,
              image_url: rImg.image_url,
              image_type: rImg.image_type,
              status: 'approved',
              sort_order: rImg.sort_order
            });
          }
        }
      }

      alert('Đã cập nhật đồng loạt các kiểu phòng thành công!');
      setShowBulkRoomModal(null);
      await loadOwnerData();
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu thay đổi!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regPassword) return;

    const emailTrimmed = regEmail.trim().toLowerCase();
    const nameTrimmed = regName.trim();
    const phoneTrimmed = regPhone.trim();

    setLoading(true);
    try {
      // Check if email already registered
      const existingProfile = await db.getProfileByEmail(emailTrimmed);
      if (existingProfile) {
        alert('Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác!');
        setAuthMode('login');
        return;
      }

      // Try registering via Supabase Auth if online
      let userId = `owner-uuid-custom-${Date.now()}`;
      const isOnline = await db.isSupabaseActive();
      if (isOnline) {
        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: regPassword,
          options: {
            data: {
              full_name: nameTrimmed,
              phone: phoneTrimmed,
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          userId = data.user.id;
        }
      }

      const newProfile: UserProfile = {
        id: userId,
        name: nameTrimmed,
        phone: phoneTrimmed,
        email: emailTrimmed,
        role: 'owner',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // In local fallback mode, store password locally in profile for validation
      if (!isOnline) {
        (newProfile as any).password = regPassword;
      }

      await db.createOwnerProfile(newProfile);

      setPendingName(regName);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setAuthMode('pending');
    } catch (err: any) {
      console.warn(err);
      alert('Đăng ký thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setLoading(true);
    try {
      // 1. Bypass check for demo/mock accounts (so they always work even when online)
      const emailLower = loginEmail.trim().toLowerCase();
      if (emailLower === 'nam@gmail.com' || emailLower === 'lan@gmail.com') {
        const roleKey = emailLower === 'nam@gmail.com' ? 'owner_nam' : 'owner_lan';
        loginAs(roleKey as any);
        setLoginEmail('');
        setLoginPassword('');
        setLoading(false);
        alert(`Chào mừng quay lại (Demo)!`);
        return;
      }

      const isOnline = await db.isSupabaseActive();
      if (isOnline) {
        // Authenticate via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password: loginPassword
        });
        if (error) {
          throw error;
        }

        if (data.user) {
          // Get profile
          let profile = await db.getProfileByEmail(data.user.email || emailLower);
          if (!profile) {
            // Auto-create missing profile (e.g., if registered via Dashboard or before DB RLS was configured)
            const newProfile: UserProfile = {
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || emailLower.split('@')[0],
              phone: data.user.phone || data.user.user_metadata?.phone || '09xxxxxxxx',
              email: emailLower,
              role: 'owner',
              status: 'pending',
              created_at: new Date().toISOString()
            };
            await db.createOwnerProfile(newProfile);
            profile = newProfile;
          }

          if (profile.status === 'pending') {
            setPendingName(profile.name);
            setAuthMode('pending');
            setLoginPassword('');
            await supabase.auth.signOut();
            return;
          }

          if (profile.status === 'rejected') {
            setPendingName(profile.name);
            setAuthMode('rejected');
            setLoginPassword('');
            await supabase.auth.signOut();
            return;
          }

          loginWithProfile({
            id: profile.id,
            name: profile.name,
            phone: profile.phone || '',
            email: profile.email,
            role: 'owner',
            status: 'active'
          });
          setLoginEmail('');
          setLoginPassword('');
        }
      } else {
        // Offline / LocalStorage mode
        const profile = await db.getProfileByEmail(loginEmail);
        if (!profile) {
          alert('Tài khoản Email này chưa được đăng ký. Vui lòng chuyển sang tab "Đăng ký"!');
          return;
        }

        const storedPassword = (profile as any).password;
        if (storedPassword && storedPassword !== loginPassword) {
          alert('Mật khẩu không chính xác!');
          return;
        }

        if (profile.status === 'pending') {
          setPendingName(profile.name);
          setAuthMode('pending');
          setLoginPassword('');
          return;
        }

        if (profile.status === 'rejected') {
          setPendingName(profile.name);
          setAuthMode('rejected');
          setLoginPassword('');
          return;
        }

        loginWithProfile({
          id: profile.id,
          name: profile.name,
          phone: profile.phone || '',
          email: profile.email,
          role: 'owner',
          status: 'active'
        });
        setLoginEmail('');
        setLoginPassword('');
      }
    } catch (err: any) {
      console.warn(err);
      alert('Đăng nhập thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshMockGoogleAccounts = async () => {
    const owners = await db.getAllOwners();
    setMockGoogleAccounts(owners);
  };

  const handleGoogleLoginWithMode = async (mode: 'login' | 'register') => {
    try {
      const isOnline = await db.isSupabaseActive();
      if (isOnline) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/owner'
          }
        });
        if (error) throw error;
      } else {
        const owners = await db.getAllOwners();
        setMockGoogleAccounts(owners);
        setMockGoogleMode(mode);
        setMockGoogleEmail(`mockgoogle_${Date.now()}@gmail.com`);
        setMockGoogleName('Chủ Trọ Google (Mock)');
        setMockGooglePhone('09' + Math.floor(10000000 + Math.random() * 90000000));
        setShowMockGoogleModal(true);
      }
    } catch (err: any) {
      alert('Lỗi đăng nhập bằng Google: ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    await handleGoogleLoginWithMode('login');
  };

  const handleRegisterMockGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = mockGoogleEmail.trim().toLowerCase();
    const nameTrimmed = mockGoogleName.trim();
    const phoneTrimmed = mockGooglePhone.trim();

    if (!emailTrimmed || !nameTrimmed || !phoneTrimmed) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      const existing = await db.getProfileByEmail(emailTrimmed);
      if (existing) {
        alert('Email này đã được sử dụng bởi một tài khoản khác!');
        return;
      }

      const newProfile: UserProfile = {
        id: `owner-uuid-google-${Date.now()}`,
        name: nameTrimmed,
        phone: phoneTrimmed,
        email: emailTrimmed,
        role: 'owner',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      await db.createOwnerProfile(newProfile);
      setPendingName(newProfile.name);
      setAuthMode('pending');
      setShowMockGoogleModal(false);
      alert('Đăng ký tài khoản Mock Google thành công! Đang chờ Admin duyệt.');
    } catch (err: any) {
      alert('Lỗi đăng ký mock Google: ' + err.message);
    }
  };

  const handleSelectMockGoogleUser = async (profile: UserProfile) => {
    try {
      if (profile.status === 'pending') {
        setPendingName(profile.name);
        setAuthMode('pending');
        loginAs('guest'); // Clear local session!
        setShowMockGoogleModal(false);
        return;
      }

      if (profile.status === 'rejected') {
        setPendingName(profile.name);
        setAuthMode('rejected');
        loginAs('guest'); // Clear local session!
        setShowMockGoogleModal(false);
        return;
      }

      if (profile.status === 'active') {
        loginWithProfile({
          id: profile.id,
          name: profile.name,
          phone: profile.phone || '',
          email: profile.email,
          role: 'owner',
          status: 'active'
        });
        setShowMockGoogleModal(false);
        alert(`Chào mừng quay lại, ${profile.name}!`);
      }
    } catch (err: any) {
      alert('Lỗi đăng nhập mock Google: ' + err.message);
    }
  };

  // --- IMAGE UPLOAD ACTION (DIRECTLY APPROVED BY DEFAULT) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP...)!');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const compressed = await compressImage(base64);
        setUploadFilePreview(compressed);
        setUploadUrl(compressed);
      } catch (err) {
        console.error(err);
        setUploadFilePreview(base64);
        setUploadUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadForm || !uploadUrl) return;
    setIsUploading(true);
    const position = Number(uploadType) || 99;
    const defaultType = showUploadForm.type === 'house' ? 'other' : 'bedroom';

    try {
      // If it's a base64 data URL from file upload, save to IndexedDB first
      let finalUrl = uploadUrl;
      if (uploadUrl.startsWith('data:')) {
        finalUrl = await saveImageToIDB(uploadUrl);
      }

      if (showUploadForm.type === 'house') {
        const existingImages = await db.getBoardingHouseImages(showUploadForm.id);
        for (const img of existingImages) {
          await db.deleteBoardingHouseImage(img.id);
        }
        await db.addBoardingHouseImage({
          boarding_house_id: showUploadForm.id,
          image_url: finalUrl,
          image_type: 'front',
          status: 'approved',
          sort_order: 1
        });
      } else {
        await db.addRoomTypeImage({
          room_type_id: showUploadForm.id,
          image_url: finalUrl,
          image_type: defaultType as any,
          status: 'approved',
          sort_order: position
        });
      }

      setUploadUrl('');
      setUploadFile(null);
      setUploadFilePreview('');
      setUploadType('1');
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Đã tải lên thành công!');
      await loadModalImages();
      await loadOwnerData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Có lỗi xảy ra khi upload ảnh.');
    } finally {
      setIsUploading(false);
    }
  };

  // Interactive handlers inside the Owner Album Modal
  const handleDeleteModalBhImage = async (imgId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bức ảnh nhà trọ này không?')) {
      try {
        await db.deleteBoardingHouseImage(imgId);
        await loadModalImages();
        await loadOwnerData();
      } catch (err) {
        alert('Có lỗi xảy ra khi xóa ảnh!');
      }
    }
  };

  const handleDeleteModalRtImage = async (imgId: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bức ảnh kiểu phòng này không?')) {
      try {
        await db.deleteRoomTypeImage(imgId);
        await loadModalImages();
        await loadOwnerData();
      } catch (err) {
        alert('Có lỗi xảy ra khi xóa ảnh!');
      }
    }
  };

  const handleUpdateModalBhImageCategory = async (imgId: number, value: any) => {
    try {
      const sortOrder = Number(value);
      await db.updateBoardingHouseImage(imgId, { sort_order: sortOrder });
      await loadModalImages();
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật vị trí ảnh!');
    }
  };

  const handleUpdateModalRtImageCategory = async (imgId: number, value: any) => {
    try {
      const sortOrder = Number(value);
      await db.updateRoomTypeImage(imgId, { sort_order: sortOrder });
      await loadModalImages();
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật vị trí ảnh!');
    }
  };

  const handleSetModalRtImageAsMain = async (imgId: number) => {
    if (!showUploadForm) return;
    try {
      const allImgs = await db.getRoomTypeImages(showUploadForm.id);
      for (const img of allImgs) {
        if (img.id === imgId) {
          await db.updateRoomTypeImage(img.id, { image_type: 'main', sort_order: 1 });
        } else {
          await db.updateRoomTypeImage(img.id, { 
            image_type: img.image_type === 'main' ? 'bedroom' : img.image_type,
            sort_order: img.sort_order <= 1 ? img.sort_order + 1 : img.sort_order 
          });
        }
      }
      await loadModalImages();
      await loadOwnerData();
      alert('Đã đặt làm ảnh chính thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi đặt làm ảnh chính!');
    }
  };

  const handleMoveModalBhImageOrder = async (imgId: number, direction: 'up' | 'down') => {
    const list = [...modalImagesBh].sort((a, b) => a.sort_order - b.sort_order);
    const index = list.findIndex(img => img.id === imgId);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    try {
      const currentImg = list[index];
      const targetImg = list[targetIndex];

      const tempOrder = currentImg.sort_order;
      await db.updateBoardingHouseImage(currentImg.id, { sort_order: targetImg.sort_order });
      await db.updateBoardingHouseImage(targetImg.id, { sort_order: tempOrder });

      await loadModalImages();
    } catch (err) {
      alert('Có lỗi xảy ra khi thay đổi thứ tự!');
    }
  };

  const handleMoveModalRtImageOrder = async (imgId: number, direction: 'up' | 'down') => {
    const list = [...modalImagesRt].sort((a, b) => a.sort_order - b.sort_order);
    const index = list.findIndex(img => img.id === imgId);
    if (index === -1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    try {
      const currentImg = list[index];
      const targetImg = list[targetIndex];

      const tempOrder = currentImg.sort_order;
      await db.updateRoomTypeImage(currentImg.id, { sort_order: targetImg.sort_order });
      await db.updateRoomTypeImage(targetImg.id, { sort_order: tempOrder });

      await loadModalImages();
    } catch (err) {
      alert('Có lỗi xảy ra khi thay đổi thứ tự!');
    }
  };

  // Trigger quick mockup upload
  const triggerQuickMockupUpload = () => {
    const urls = [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d95280?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'
    ];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    setUploadUrl(randomUrl);
  };

  // --- AUTH CHECKING LOADER SCREEN ---
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#000c24] flex flex-col items-center justify-center gap-4 relative overflow-hidden font-sans">
        {/* Glow ambient */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#0075de] animate-spin mx-auto animate-duration-1000" />
          <p className="text-slate-400 font-black tracking-widest uppercase text-[10px]">Đang xác thực tài khoản chủ trọ...</p>
        </div>
      </div>
    );
  }

  // --- GUEST OR UNAUTHORIZED SHIELD ---
  if (!currentUser || currentUser.role !== 'owner') {
    return (
      <div className="min-h-screen bg-[#000c24] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Glow ambient */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* ── PENDING APPROVAL SCREEN ── */}
        {authMode === 'pending' && (
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-8 md:p-10 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-black text-slate-900 tracking-tight">Đang Chờ Xét Duyệt</h2>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Xin chào <span className="text-[#0075de] font-extrabold">{pendingName}</span>! Yêu cầu đăng ký tài khoản của bạn đã được tiếp nhận.
              </p>
            </div>
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 text-left space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quy trình xác thực đối tác</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0075de] mt-1.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-600">Admin Sale Hùng đang kiểm định hồ sơ đối tác chủ trọ.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0075de] mt-1.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-600">Thời gian xử lý thông thường tối đa <strong>24 giờ làm việc</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0075de] mt-1.5 shrink-0" />
                  <p className="text-xs font-medium text-slate-600">Hệ thống sẽ tự động kích hoạt Dashboard sau khi được duyệt.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAuthMode('login')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl h-12 font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Quay lại đăng nhập
            </button>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Về trang chủ
            </Link>
          </div>
        )}

        {/* ── REJECTED SCREEN ── */}
        {authMode === 'rejected' && (
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-8 md:p-10 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-black text-slate-900 tracking-tight">Tài Khoản Bị Từ Chối</h2>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Rất tiếc <span className="text-red-500 font-extrabold">{pendingName}</span>, yêu cầu phê duyệt đã bị từ chối.
              </p>
            </div>
            <div className="bg-red-50/55 border border-red-100 rounded-2xl p-5 text-left">
              <p className="text-xs font-medium text-red-600/90 leading-relaxed">
                Vui lòng liên hệ trực tiếp với môi giới <strong>Sale Hùng</strong> qua hotline <strong>0912.345.678</strong> hoặc Zalo để cập nhật lại thông tin hồ sơ.
              </p>
            </div>
            <button
              onClick={() => setAuthMode('login')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl h-12 font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Quay lại đăng nhập
            </button>
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Về trang chủ
            </Link>
          </div>
        )}

        {/* ── LOGIN / REGISTER FORM ── */}
        {(authMode === 'login' || authMode === 'register') && (
          <div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] p-8 md:p-10 text-center space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="space-y-3 text-center">
              <div className="relative w-20 h-20 bg-gradient-to-tr from-[#0075de] to-indigo-700 text-white rounded-[1.8rem] flex items-center justify-center mx-auto shadow-xl shadow-[#0075de]/20 overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Lock className="w-9 h-9 relative z-10 animate-pulse duration-[3000ms]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tight">Khu Vực Chủ Trọ</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cổng xác thực đối tác • Sale Hùng</p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50">
              <button type="button" onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 ${
                  authMode === 'login' ? 'bg-gradient-to-r from-[#0075de] to-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                }`}>
                Đăng Nhập
              </button>
              <button type="button" onClick={() => setAuthMode('register')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 active:scale-95 ${
                  authMode === 'register' ? 'bg-gradient-to-r from-[#0075de] to-indigo-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
                }`}>
                Đăng Ký
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLoginOwner} autoComplete="off" className="space-y-5 text-left">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email hoặc Số điện thoại *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="text" required placeholder="Nhập email hoặc số điện thoại..."
                      autoComplete="off"
                      value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mật khẩu *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="password" required placeholder="Nhập mật khẩu của bạn..."
                      autoComplete="new-password"
                      value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0075de] to-indigo-900 hover:opacity-95 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-lg shadow-[#0075de]/15 active:scale-[0.98] transition-all">
                  {loading ? 'Đang xử lý...' : 'Đăng nhập hệ thống'}
                </Button>

                {/* Google Sign In Option */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <span className="relative px-3 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">Hoặc</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleLoginWithMode('login')}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterOwner} autoComplete="off" className="space-y-4 text-left">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-left">
                  <p className="text-xs font-bold text-blue-700">📋 Sau khi đăng ký, tài khoản cần được <strong>Admin duyệt</strong> trước khi sử dụng.</p>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Họ và tên chủ nhà *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <User className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="text" required placeholder="Họ và tên đầy đủ..."
                      autoComplete="off"
                      value={regName} onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa chỉ Email *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="email" required placeholder="email@example.com..."
                      autoComplete="off"
                      value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số điện thoại liên hệ *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <Phone className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="tel" required placeholder="09xxxxxxxx..."
                      autoComplete="off"
                      value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mật khẩu đăng ký *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-[#0075de] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0075de]/5 rounded-2xl px-4 py-3.5 transition-all duration-200">
                    <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input type="password" required placeholder="Mật khẩu tối thiểu 6 ký tự..."
                      autoComplete="new-password"
                      value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400/80" />
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/15 active:scale-[0.98] transition-all">
                  {loading ? 'Đang xử lý...' : 'Gửi yêu cầu đăng ký'}
                </Button>

                {/* Google Sign In/Up Option for Registration */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <span className="relative px-3 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">Hoặc</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleLoginWithMode('register')}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Đăng ký nhanh bằng Google
                </button>
              </form>
            )}

            <div className="text-center pt-4 border-t border-slate-100">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for Owner */}
      <aside className="w-64 bg-[#001a3d] text-white flex flex-col shrink-0 hidden md:flex">
        <div className="h-24 flex items-center px-8 border-b border-white/5 gap-3">
          <div className="w-10 h-10 bg-[#0075de] border-2 border-white rounded-xl flex items-center justify-center font-black text-white text-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight leading-none truncate w-36">{currentUser.name}</h1>
            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest mt-1">Chủ Trọ Đối Tác</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button 
            onClick={() => { setActiveTab('houses'); setShowHouseForm(false); setShowRoomForm(false); setShowUploadForm(null); }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-left transition-all ${
              activeTab === 'houses' && !showHouseForm && !showRoomForm && !showUploadForm
                ? 'bg-[#0075de] text-white shadow-lg shadow-[#0075de]/30' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" /> Nhà trọ của tôi
          </button>
          
          <button 
            onClick={() => { setActiveTab('roomTypes'); setShowHouseForm(false); setShowRoomForm(false); setShowUploadForm(null); }}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-left transition-all ${
              activeTab === 'roomTypes' && !showHouseForm && !showRoomForm && !showUploadForm
                ? 'bg-[#0075de] text-white shadow-lg shadow-[#0075de]/30' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Loại phòng cho thuê
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link 
            href="/"
            className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl font-black text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Web
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div>
            <h2 className="text-xl font-heading font-black text-gray-900 tracking-tight">Quản Lý Phòng Trọ</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kênh thông tin chủ nhà đối tác của Sale Hùng</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider border-none px-3.5 py-1.5">
              Pending: {pendingImagesCount} ảnh chờ duyệt
            </Badge>
          </div>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f8fafc]">
          
          {/* ==================== SCREEN 0: APPROVAL WELCOME BANNER ==================== */}
          {showApprovalAlert && currentUser && (
            <div className="mb-8 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4 shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/10">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 pr-6">
                <h4 className="text-sm font-black text-slate-900 leading-none">Tài khoản đối tác đã được phê duyệt thành công!</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Xin chúc mừng đối tác <strong className="text-emerald-600 font-bold">{currentUser.name}</strong>! Yêu cầu đăng ký tài khoản chủ trọ của bạn đã được kiểm duyệt và chấp thuận bởi Admin Sale Hùng. Bây giờ bạn có thể bắt đầu đăng tin, quản lý nhà trọ và các loại phòng cho thuê của mình.
                </p>
              </div>
              <button 
                onClick={() => {
                  localStorage.setItem(`dismissed_approval_${currentUser.id}`, 'true');
                  setShowApprovalAlert(false);
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ==================== SCREEN 1: ADD/EDIT HOUSE FORM ==================== */}
          {showHouseForm ? (
            <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 md:p-10">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-6">
                <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tight">
                  {editingHouse ? 'Chỉnh sửa nhà trọ' : 'Thêm mới nhà trọ'}
                </h3>
                <button 
                  onClick={() => { setShowHouseForm(false); setEditingHouse(null); }}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHouse} className="space-y-6">
                {/* Tên nhà trọ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tên tòa nhà / Nhà trọ</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Trọ Nguyễn Văn Cừ"
                    value={houseName}
                    onChange={(e) => setHouseName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                  />
                </div>

                {/* Địa chỉ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Địa chỉ chi tiết *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Số 123, đường Tân Xã..."
                    value={houseAddress}
                    onChange={(e) => setHouseAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                  />
                </div>

                {/* Khu vực */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Khu vực *</label>
                  <select 
                    required
                    value={houseZone}
                    onChange={(e) => setHouseZone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm cursor-pointer"
                  >
                    <option value="">-- Chọn khu vực --</option>
                    <option value="Thạch Hòa">Thạch Hòa</option>
                    <option value="Tân Xã">Tân Xã</option>
                    <option value="Bình Yên">Bình Yên</option>
                    <option value="Sơn Tây">Sơn Tây</option>
                    <option value="Hạ Bằng">Hạ Bằng</option>
                    <option value="Bắc Phú Cát">Bắc Phú Cát</option>
                    <option value="Phú Hữu">Phú Hữu</option>
                  </select>
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Mô tả tòa nhà</label>
                  <textarea 
                    rows={3}
                    placeholder="Mô tả các tiện ích chung, hầm xe, an ninh..."
                    value={houseDesc}
                    onChange={(e) => setHouseDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm resize-none"
                  />
                </div>

                {/* Nội quy */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Quy định nhà trọ</label>
                  <textarea 
                    rows={2}
                    placeholder="Quy định về giờ giấc, thú cưng, giữ vệ sinh..."
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm resize-none"
                  />
                </div>

                {/* Lat Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vĩ độ (Latitude)</label>
                    <input 
                      type="text" 
                      placeholder="21.0125"
                      value={houseLat}
                      onChange={(e) => setHouseLat(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Kinh độ (Longitude)</label>
                    <input 
                      type="text" 
                      placeholder="105.5269"
                      value={houseLng}
                      onChange={(e) => setHouseLng(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                </div>

                {/* Map Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Chọn vị trí trên bản đồ</label>
                  <p className="text-[9px] text-gray-400 font-semibold italic mt-0.5">
                    * Click/Chạm vào bản đồ để chọn tọa độ chính xác. Vị trí công khai chỉ hiển thị vòng tròn bán kính 150m.
                  </p>
                  <div className="h-60 w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm mt-2 relative bg-gray-50">
                    <MapPicker 
                      latitude={Number(houseLat) || 21.0125} 
                      longitude={Number(houseLng) || 105.5269} 
                      onChange={(lat, lng) => {
                        setHouseLat(lat.toFixed(6));
                        setHouseLng(lng.toFixed(6));
                      }} 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#0075de] hover:bg-opacity-95 text-white font-black h-14 rounded-2xl text-xs uppercase tracking-wider"
                  >
                    Xác nhận lưu thông tin
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => { setShowHouseForm(false); setEditingHouse(null); }}
                    className="border-gray-200 text-gray-700 h-14 rounded-2xl text-xs font-black uppercase tracking-wider"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </form>
            </div>
          ) : showRoomForm ? (
            // ==================== SCREEN 2: ADD/EDIT ROOM TYPE FORM ====================
            <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 md:p-10">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-6">
                <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tight">
                  {editingRoom ? 'Chỉnh sửa loại phòng' : 'Thêm mới loại phòng'}
                </h3>
                <button 
                  onClick={() => { setShowRoomForm(false); setEditingRoom(null); }}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRoom} className="space-y-6">
                {/* Chọn tòa nhà trọ */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Thuộc tòa nhà trọ</label>
                  <select
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm cursor-pointer"
                  >
                    <option value="">Chọn nhà trọ sở hữu...</option>
                    {myHouses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tên loại phòng */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tên loại phòng</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Phòng Standard, Deluxe, Studio..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                  />
                </div>

                {/* Giá từ & Diện tích */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Giá thuê từ (VNĐ/tháng)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Ví dụ: 3000000"
                      value={roomPrice}
                      onChange={(e) => setRoomPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Diện tích (m²)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Ví dụ: 25"
                      value={roomArea}
                      onChange={(e) => setRoomArea(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                </div>

                {/* Phí dịch vụ & Giá điện */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Phí dịch vụ (VNĐ/tháng)</label>
                    <input 
                      type="number" 
                      placeholder="Ví dụ: 150000"
                      value={roomServiceFee}
                      onChange={(e) => setRoomServiceFee(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Giá điện (VNĐ/kWh)</label>
                    <input 
                      type="number" 
                      placeholder="Ví dụ: 3500"
                      value={roomElectricityPrice}
                      onChange={(e) => setRoomElectricityPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                </div>

                {/* Số người & Video */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Số người ở tối đa</label>
                    <input 
                      type="number" 
                      required
                      placeholder="2"
                      value={roomMaxPeople}
                      onChange={(e) => setRoomMaxPeople(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Đường dẫn Video giới thiệu (nếu có)</label>
                    <input 
                      type="text" 
                      placeholder="YouTube URL..."
                      value={roomVideo}
                      onChange={(e) => setRoomVideo(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                  </div>
                </div>

                {/* Mô tả loại phòng */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Mô tả phòng</label>
                  <textarea 
                    rows={3}
                    placeholder="Mô tả kết cấu căn phòng, gác lửng, nội thất..."
                    value={roomDesc}
                    onChange={(e) => setRoomDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-4 py-3.5 text-xs font-bold outline-none text-gray-700 shadow-sm resize-none"
                  />
                </div>

                {/* Tiện nghi Checkboxes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Tiện nghi có sẵn</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {customUtilities.map((ut, idx) => {
                      const isChecked = roomUtilities.includes(ut);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUtilityToggle(ut)}
                          className={`px-4 py-3 border rounded-2xl flex items-center justify-between text-xs font-bold uppercase tracking-wider text-left transition-all active:scale-95 ${
                            isChecked 
                              ? 'bg-blue-50 border-[#0075de] text-[#0075de]' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <span>{ut}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#0075de]" />}
                        </button>
                      );
                    })}
                  </div>
                  {/* Form tự thêm tiện nghi */}
                  <div className="flex gap-2 max-w-sm mt-3 pt-2">
                    <input
                      type="text"
                      placeholder="Thêm tiện nghi tự nhập khác..."
                      value={newUtilityInput}
                      onChange={(e) => setNewUtilityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewUtility();
                        }
                      }}
                      className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-4 py-2 text-xs font-bold outline-none text-gray-700 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewUtility}
                      className="bg-[#0075de] hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </button>
                  </div>
                </div>

                {/* Quản lý danh sách phòng thực tế */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Danh sách phòng chi tiết (Tình trạng còn phòng)</label>
                  
                  {/* Form thêm phòng */}
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      placeholder="Tên phòng (ví dụ: P101, Phòng 102)..."
                      value={newRoomInput}
                      onChange={(e) => setNewRoomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSingleAddPhysicalRoom();
                        }
                      }}
                      className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-4 py-2 text-xs font-bold outline-none text-slate-700 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSingleAddPhysicalRoom}
                      className="bg-[#0075de] hover:bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0 shadow-md shadow-blue-500/10"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </button>
                  </div>

                  {/* Danh sách phòng hiện có */}
                  {formRooms.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-100">
                      Chưa có phòng nào được gán cho kiểu phòng này. Hãy thêm phòng ở trên để quản lý tình trạng còn phòng.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formRooms.map((pRoom, pRoomIdx) => (
                        <div
                          key={pRoomIdx}
                          className={`px-3.5 py-2.5 border rounded-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                            pRoom.available
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                              : 'bg-red-50/50 border-red-200 text-red-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={pRoom.available}
                            onChange={() => handleSingleTogglePhysicalRoomAvailability(pRoomIdx)}
                            className="w-4 h-4 rounded border-gray-300 text-[#0075de] focus:ring-[#0075de] cursor-pointer"
                            id={`chk-single-room-${pRoomIdx}`}
                          />
                          <label
                            htmlFor={`chk-single-room-${pRoomIdx}`}
                            className="cursor-pointer select-none text-[11px] text-gray-700"
                          >
                            {pRoom.name} ({pRoom.available ? 'Còn phòng' : 'Hết phòng'})
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSingleRemovePhysicalRoom(pRoomIdx)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-1.5 active:scale-90"
                            title="Xóa phòng"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quản lý hình ảnh kiểu phòng */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Hình ảnh kiểu phòng</label>
                  
                  <div className="space-y-3">
                    {/* Method toggler */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl max-w-xs">
                      <button
                        type="button"
                        onClick={() => setRoomUploadMode('file')}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          roomUploadMode === 'file' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        📁 Tải từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomUploadMode('url')}
                        className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          roomUploadMode === 'url' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        🔗 Nhập URL
                      </button>
                    </div>

                    {roomUploadMode === 'file' ? (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleRoomFormFileChange}
                          className="hidden"
                          id="room-form-file-picker"
                        />
                        <label
                          htmlFor="room-form-file-picker"
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsRoomFormDragOver(true); }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsRoomFormDragOver(true); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsRoomFormDragOver(false); }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsRoomFormDragOver(false);
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) {
                              await processRoomFiles(files);
                            }
                          }}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 block text-xs font-bold text-gray-600 ${
                            isRoomFormDragOver
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-inner'
                              : 'bg-white border-gray-200 hover:border-[#0075de]'
                          }`}
                        >
                          {isRoomFormDragOver ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 py-4 animate-pulse">
                              <UploadCloud className="w-8 h-8 text-indigo-600" />
                              <span className="text-indigo-600">Thả ảnh ở đây để tải lên...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <UploadCloud className="w-8 h-8 text-gray-400" />
                              <span>📷 Kéo thả ảnh vào đây hoặc nhấn để chọn từ máy</span>
                              <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider">Hỗ trợ tải lên nhiều ảnh cùng lúc (Dưới 5MB)</span>
                            </div>
                          )}
                        </label>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Nhập link URL ảnh..."
                          value={roomFormUrlInput}
                          onChange={(e) => setRoomFormUrlInput(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-700"
                        />
                        <Button
                          type="button"
                          onClick={handleRoomFormAddUrl}
                          className="bg-[#0075de] hover:bg-opacity-95 text-white font-black text-[9px] uppercase tracking-wider rounded-xl px-4 animate-none border-none shadow-none flex items-center justify-center"
                        >
                          Thêm
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Room images preview list */}
                  {formRoomImages.length === 0 ? (
                    <div className="text-center py-10 text-xs font-bold text-gray-400 bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">
                      Chưa có ảnh nào được thêm cho kiểu phòng này!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1 pt-1">
                      {formRoomImages.map((img, idx) => {
                        const isMain = img.image_type === 'main';
                        return (
                          <div key={idx} className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white shrink-0 transition-all ${
                            isMain ? 'border-[#0075de] ring-1 ring-[#0075de]' : 'border-gray-100 hover:border-gray-200'
                          }`}>
                            <div className="group relative aspect-[16/10] w-full bg-gray-50 overflow-hidden">
                              <IDBImage src={img.image_url} alt="Preview" className="w-full h-full object-cover" />
                              
                              {/* Main image badge */}
                              {isMain && (
                                <span className="absolute top-2 left-2 bg-[#0075de] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 z-10">
                                  <Star className="w-2.5 h-2.5 fill-current text-yellow-400" /> Ảnh chính
                                </span>
                              )}

                              {/* Hover delete button */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                <button
                                  type="button"
                                  onClick={() => handleRoomFormRemoveImage(idx)}
                                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90"
                                  title="Xóa ảnh"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="p-2.5 flex flex-col gap-1.5 bg-gray-50 border-t border-gray-100 min-h-[48px]">
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-black text-gray-900 uppercase">Ảnh {idx + 1}</span>
                                {!isMain && (
                                  <button
                                    type="button"
                                    onClick={() => handleRoomFormSetMain(idx)}
                                    className="text-[#0075de] hover:underline uppercase text-[10px] font-black tracking-wider transition-all"
                                  >
                                    Đặt chính
                                  </button>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">
                                {idx === 0 ? '• Ảnh lớn bên trái (Khung to)' :
                                 idx === 1 ? '• Ảnh nhỏ trên-trái' :
                                 idx === 2 ? '• Ảnh nhỏ trên-phải' :
                                 idx === 3 ? '• Ảnh nhỏ dưới-trái' :
                                 idx === 4 ? '• Ảnh nhỏ dưới-phải' :
                                 `• Chỉ hiện khi ấn "Xem tất cả" (Thứ tự #${idx + 1})`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-[#0075de] hover:bg-opacity-95 text-white font-black h-14 rounded-2xl text-xs uppercase tracking-wider"
                  >
                    Xác nhận lưu thông tin
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => { setShowRoomForm(false); setEditingRoom(null); }}
                    className="border-gray-200 text-gray-700 h-14 rounded-2xl text-xs font-black uppercase tracking-wider"
                  >
                    Hủy bỏ
                  </Button>
                </div>
              </form>
            </div>
          ) : showBulkRoomModal ? (
            // ==================== SCREEN 5: UNIFIED ROOM TYPES EDITOR VIEW ====================
            <div className="max-w-6xl w-full mx-auto bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 md:p-10 text-left animate-in fade-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-6">
                <div>
                  <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tight">⚙️ Quản Lý Đồng Thời Kiểu Phòng</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Nhà trọ: {myHouses.find(h => h.id === showBulkRoomModal.houseId)?.name || 'Unknown'}
                  </span>
                </div>
                <button 
                  onClick={() => setShowBulkRoomModal(null)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bulkRooms.length === 0 ? (
                <div className="text-center py-16 text-xs font-bold text-gray-400 border-2 border-dashed border-gray-100 rounded-xl space-y-4">
                  <p>🏠 Chưa có kiểu phòng nào trong nhà trọ này.</p>
                  <Button
                    onClick={handleAddBulkRoomRow}
                    className="bg-[#0075de] hover:bg-opacity-95 text-white font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider"
                  >
                    + Thêm kiểu phòng đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {bulkRooms.map((room, idx) => {
                      const isExpanded = expandedRoomId === room.id;
                      return (
                        <div 
                          key={`bulk-room-${room.id}`} 
                          className={`border rounded-xl p-6 transition-all duration-200 bg-white ${
                            isExpanded ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-md' : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {/* Core Row Fields */}
                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            {/* Room Name */}
                            <div className="flex-1 w-full space-y-1">
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Tên kiểu phòng</label>
                              <input 
                                type="text"
                                required
                                value={room.name}
                                onChange={(e) => handleUpdateBulkRoomField(room.id, 'name', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3 py-2 text-xs font-bold outline-none text-gray-700"
                                placeholder="Ví dụ: Phòng Standard"
                              />
                            </div>

                            {/* Price */}
                            <div className="w-full md:w-44 space-y-1">
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Giá thuê (VNĐ)</label>
                              <input 
                                type="number"
                                required
                                value={room.price_from}
                                onChange={(e) => handleUpdateBulkRoomField(room.id, 'price_from', Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3 py-2 text-xs font-bold outline-none text-gray-700"
                                placeholder="Ví dụ: 3000000"
                              />
                            </div>

                            {/* Area */}
                            <div className="w-full md:w-28 space-y-1">
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Diện tích (m²)</label>
                              <input 
                                type="number"
                                required
                                value={room.area}
                                onChange={(e) => handleUpdateBulkRoomField(room.id, 'area', Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3 py-2 text-xs font-bold outline-none text-gray-700"
                                placeholder="20"
                              />
                            </div>

                            {/* Max People */}
                            <div className="w-full md:w-28 space-y-1">
                              <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Người ở tối đa</label>
                              <input 
                                type="number"
                                required
                                value={room.max_people}
                                onChange={(e) => handleUpdateBulkRoomField(room.id, 'max_people', Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3 py-2 text-xs font-bold outline-none text-gray-700"
                                placeholder="2"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 w-full md:w-auto pt-4 md:pt-0 shrink-0 self-end md:self-center">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                                className={`rounded-xl text-[10px] font-black uppercase tracking-wider px-3.5 py-3.5 ${
                                  isExpanded ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                {isExpanded ? 'Ẩn tiện nghi' : 'Chi tiết & Tiện nghi'}
                              </Button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBulkRoomRow(room.id)}
                                className="p-3 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95 shrink-0"
                                title="Xóa kiểu phòng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Advanced Section */}
                          {isExpanded && (
                            <div className="mt-5 pt-5 border-t border-gray-100 space-y-5 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Room description */}
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Mô tả chi tiết kiểu phòng</label>
                                  <textarea
                                    rows={2}
                                    value={room.description || ''}
                                    onChange={(e) => handleUpdateBulkRoomField(room.id, 'description', e.target.value)}
                                    placeholder="Mô tả kết cấu căn phòng, gác lửng, nội thất..."
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-700 resize-none"
                                  />
                                </div>

                                {/* YouTube Video link */}
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Đường dẫn Video thực tế (YouTube)</label>
                                  <input
                                    type="text"
                                    value={room.video_url || ''}
                                    onChange={(e) => handleUpdateBulkRoomField(room.id, 'video_url', e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-gray-700"
                                  />
                                  <span className="text-[8px] text-gray-400 font-bold block pt-1 uppercase tracking-wider">Dán link YouTube để hiển thị trình phát video thực tế cho khách</span>
                                </div>
                              </div>

                              {/* Utility checkboxes list */}
                              <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Tiện nghi có sẵn</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                  {customUtilities.map((ut, utIdx) => {
                                    const isChecked = (room.utilities || []).includes(ut);
                                    return (
                                      <button
                                        key={utIdx}
                                        type="button"
                                        onClick={() => handleToggleBulkRoomUtility(room.id, ut)}
                                        className={`px-3 py-2 border rounded-xl flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-left transition-all active:scale-95 ${
                                          isChecked 
                                            ? 'bg-blue-50 border-[#0075de] text-[#0075de]' 
                                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                        }`}
                                      >
                                        <span className="truncate">{ut}</span>
                                        {isChecked && <Check className="w-3 h-3 text-[#0075de] shrink-0 ml-1" />}
                                      </button>
                                    );
                                  })}
                                </div>
                                {/* Thêm tiện nghi trong bulk edit */}
                                <div className="flex gap-2 max-w-xs mt-2">
                                  <input
                                    type="text"
                                    placeholder="Thêm tiện nghi khác..."
                                    value={bulkNewUtilityInput[room.id] || ''}
                                    onChange={(e) => setBulkNewUtilityInput(prev => ({ ...prev, [room.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewUtilityBulk(room.id);
                                      }
                                    }}
                                    className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-lg px-2.5 py-1.5 text-[10px] font-bold outline-none text-gray-700 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddNewUtilityBulk(room.id)}
                                    className="bg-[#0075de] hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Thêm
                                  </button>
                                </div>
                              </div>

                              {/* Quản lý danh sách phòng thực tế trong bulk edit */}
                              <div className="space-y-3 pt-4 border-t border-gray-100">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Danh sách phòng chi tiết (Tình trạng còn phòng)</label>
                                
                                {/* Form thêm phòng */}
                                <div className="flex gap-2 max-w-sm">
                                  <input
                                    type="text"
                                    placeholder="Tên phòng (ví dụ: P101, Phòng 102)..."
                                    value={bulkNewRoomInput[room.id] || ''}
                                    onChange={(e) => setBulkNewRoomInput(prev => ({ ...prev, [room.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddPhysicalRoomBulk(room.id);
                                      }
                                    }}
                                    className="flex-1 bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-lg px-2.5 py-1.5 text-[10px] font-bold outline-none text-slate-700 shadow-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddPhysicalRoomBulk(room.id)}
                                    className="bg-[#0075de] hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0"
                                  >
                                    <Plus className="w-3 h-3" /> Thêm phòng
                                  </button>
                                </div>

                                {/* Danh sách phòng hiện có */}
                                {(!room.rooms || room.rooms.length === 0) ? (
                                  <p className="text-[10px] font-bold text-gray-400 bg-gray-50/50 p-3 rounded-lg border border-dashed border-gray-100">
                                    Chưa có phòng nào được gán cho kiểu phòng này. Hãy thêm phòng ở trên để quản lý tình trạng còn phòng.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {room.rooms.map((pRoom: any, pRoomIdx: number) => (
                                      <div
                                        key={pRoomIdx}
                                        className={`px-3 py-2 border rounded-xl flex items-center gap-2.5 text-[10px] font-bold transition-all ${
                                          pRoom.available
                                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                                            : 'bg-red-50/50 border-red-200 text-red-600'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={pRoom.available}
                                          onChange={() => handleTogglePhysicalRoomAvailability(room.id, pRoomIdx)}
                                          className="w-3.5 h-3.5 rounded border-gray-300 text-[#0075de] focus:ring-[#0075de] cursor-pointer"
                                          id={`chk-room-${room.id}-${pRoomIdx}`}
                                        />
                                        <label
                                          htmlFor={`chk-room-${room.id}-${pRoomIdx}`}
                                          className="cursor-pointer select-none text-slate-700"
                                        >
                                          {pRoom.name} ({pRoom.available ? 'Còn phòng' : 'Hết phòng'})
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePhysicalRoomBulk(room.id, pRoomIdx)}
                                          className="text-gray-400 hover:text-red-500 transition-colors ml-1 active:scale-90"
                                          title="Xóa phòng"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                               {/* Hình ảnh kiểu phòng trong sửa nhanh */}
                              <div className="space-y-3 pt-4 border-t border-gray-100">
                                <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Hình ảnh kiểu phòng</label>
                                
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleBulkRoomFileChange(room.id, e)}
                                    className="hidden"
                                    id={`bulk-file-input-${room.id}`}
                                  />
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <label
                                      htmlFor={`bulk-file-input-${room.id}`}
                                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setBulkDragOverRoomId(room.id); }}
                                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setBulkDragOverRoomId(room.id); }}
                                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setBulkDragOverRoomId(null); }}
                                      onDrop={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setBulkDragOverRoomId(null);
                                        const files = e.dataTransfer.files;
                                        if (files && files.length > 0) {
                                          await processBulkRoomFiles(room.id, files);
                                        }
                                      }}
                                      className={`flex-1 border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-200 block text-xs font-bold text-gray-600 ${
                                        bulkDragOverRoomId === room.id
                                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-inner'
                                          : 'bg-white border-gray-200 hover:border-[#0075de]'
                                      }`}
                                    >
                                      {bulkDragOverRoomId === room.id ? (
                                        <div className="flex items-center justify-center gap-1.5 py-1 animate-pulse">
                                          <UploadCloud className="w-4 h-4 text-indigo-600" />
                                          <span className="text-indigo-600">Thả ảnh tại đây...</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center gap-2 py-1">
                                          <UploadCloud className="w-4 h-4 text-gray-400" />
                                          <span>📷 Kéo thả ảnh hoặc click để chọn từ máy</span>
                                        </div>
                                      )}
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = prompt('Nhập đường dẫn URL hình ảnh kiểu phòng:');
                                        if (url) {
                                          handleBulkRoomAddUrl(room.id, url);
                                        }
                                      }}
                                      className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" /> Nhập URL ảnh
                                    </button>
                                  </div>
                                </div>

                                {/* Current Photos Grid */}
                                {(!room.images || room.images.length === 0) ? (
                                  <div className="text-center py-6 text-[10px] font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                    Chưa có ảnh nào. Hãy nhấn nút phía trên để thêm ảnh cho phòng!
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-1 pt-1">
                                    {room.images.map((img: any, imgIdx: number) => {
                                      const isMain = img.image_type === 'main';
                                      return (
                                        <div key={imgIdx} className={`relative rounded-2xl overflow-hidden border bg-white flex flex-col justify-between transition-all ${
                                          isMain ? 'border-[#0075de] ring-1 ring-[#0075de] shadow-sm' : 'border-gray-100 hover:border-gray-200'
                                        }`}>
                                          <div className="aspect-[16/10] w-full bg-gray-50 relative group">
                                            <IDBImage src={img.image_url} alt="Room" className="w-full h-full object-cover" />
                                            {isMain && (
                                              <span className="absolute top-2 left-2 bg-[#0075de] text-white px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 z-10">
                                                <Star className="w-2.5 h-2.5 fill-current text-yellow-400" /> Ảnh chính
                                              </span>
                                            )}
                                            {/* Delete Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                                              <button
                                                type="button"
                                                onClick={() => handleBulkRoomRemoveImage(room.id, imgIdx)}
                                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90"
                                                title="Xóa ảnh"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="p-2.5 flex flex-col gap-1.5 bg-gray-50 border-t border-gray-100 min-h-[48px]">
                                            <div className="flex items-center justify-between w-full">
                                              <span className="text-[10px] font-black text-gray-900 uppercase">Ảnh {imgIdx + 1}</span>
                                              {!isMain && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleBulkRoomSetMain(room.id, imgIdx)}
                                                  className="text-[#0075de] hover:underline uppercase text-[9px] font-black tracking-wider text-center"
                                                >
                                                  Đặt chính
                                                </button>
                                              )}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-500">
                                              {imgIdx === 0 ? '• Ảnh lớn bên trái (Khung to)' :
                                               imgIdx === 1 ? '• Ảnh nhỏ trên-trái' :
                                               imgIdx === 2 ? '• Ảnh nhỏ trên-phải' :
                                               imgIdx === 3 ? '• Ảnh nhỏ dưới-trái' :
                                               imgIdx === 4 ? '• Ảnh nhỏ dưới-phải' :
                                               `• Chỉ hiện khi ấn "Xem tất cả" (Thứ tự #${imgIdx + 1})`}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bulk view Footer controls */}
                  <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddBulkRoomRow}
                      className="w-full sm:w-auto border-dashed border-2 hover:border-[#0075de] hover:text-[#0075de] text-gray-600 rounded-xl px-5 py-5 font-black text-xs uppercase tracking-wider bg-white active:scale-95 transition-all"
                    >
                      + Thêm kiểu phòng mới vào bảng
                    </Button>

                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={handleSaveBulkRoomsAll}
                        className="flex-1 sm:flex-initial bg-[#0075de] hover:bg-opacity-95 text-white font-black h-14 px-8 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#0075de]/15"
                      >
                        Lưu tất cả thay đổi
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ các thay đổi chưa lưu?')) {
                            setShowBulkRoomModal(null);
                          }
                        }}
                        className="border-gray-200 text-gray-700 h-14 rounded-2xl text-xs font-black uppercase tracking-wider px-6"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ==================== SCREEN 4: OWNER MAIN WORKSPACE ====================
            <div className="space-y-8">
              {/* Mobile Tab Row */}
              <div className="flex md:hidden bg-white p-1 rounded-2xl border border-gray-100 shadow-sm gap-1">
                <button
                  onClick={() => { setActiveTab('houses'); setShowHouseForm(false); setShowRoomForm(false); setShowUploadForm(null); }}
                  className={`flex-1 py-3 text-center rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                    activeTab === 'houses'
                      ? 'bg-[#0075de] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Nhà trọ của tôi
                </button>
                <button
                  onClick={() => { setActiveTab('roomTypes'); setShowHouseForm(false); setShowRoomForm(false); setShowUploadForm(null); }}
                  className={`flex-1 py-3 text-center rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                    activeTab === 'roomTypes'
                      ? 'bg-[#0075de] text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Loại phòng cho thuê
                </button>
              </div>

              {/* Overview cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { id: 'houses', title: 'Nhà Trọ của tôi', value: myHouses.length, label: 'Tòa nhà quản lý', bg: 'bg-[#0075de]/5', color: 'text-[#0075de]' },
                  { id: 'roomTypes', title: 'Loại phòng đang đăng', value: myRoomTypes.length, label: 'Bài trưng bày phòng', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                  { id: 'pending', title: 'Ảnh Đang chờ duyệt', value: pendingImagesCount, label: 'Admin kiểm duyệt chất lượng', bg: 'bg-amber-50', color: 'text-amber-600' }
                ].map((stat, i) => {
                  const isActive = activeTab === stat.id;
                  const isClickable = stat.id !== 'pending';
                  return (
                    <Card 
                      key={i} 
                      onClick={() => {
                        if (stat.id === 'houses') {
                          setActiveTab('houses');
                          setShowHouseForm(false);
                          setShowRoomForm(false);
                          setShowUploadForm(null);
                        } else if (stat.id === 'roomTypes') {
                          setActiveTab('roomTypes');
                          setShowHouseForm(false);
                          setShowRoomForm(false);
                          setShowUploadForm(null);
                        }
                      }}
                      className={`border-none shadow-sm rounded-xl overflow-hidden transition-all duration-200 ${
                        isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''
                      } ${
                        isActive ? 'ring-2 ring-[#0075de] bg-blue-50/20' : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{stat.title}</span>
                        <span className={`text-3xl font-black ${stat.color} tracking-tight mt-1 block`}>{stat.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 block mt-1">{stat.label}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Tab 1: Boarding Houses List */}
              {activeTab === 'houses' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center gap-4 flex-wrap">
                    <div>
                      <h3 className="font-heading font-black text-gray-900 text-lg">Danh sách Tòa nhà trọ của tôi</h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">Thông tin các khu trọ trọn gói bạn sở hữu đang trưng bày trên hệ thống.</p>
                    </div>

                    <Button 
                      onClick={() => {
                        setEditingHouse(null);
                        setHouseName('');
                        setHouseAddress('');
                        setHouseZone('');
                        setHouseDesc('');
                        setHouseRules('');
                        setHouseLat('21.0125');
                        setHouseLng('105.5269');
                        setShowHouseForm(true);
                      }}
                      className="bg-[#0075de] text-white hover:bg-opacity-95 rounded-xl px-5 py-5 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0075de]/15"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Thêm tòa nhà trọ mới
                    </Button>
                  </div>

                  {myHouses.length === 0 ? (
                    <div className="text-center py-20 text-xs font-bold text-gray-400">
                      Bạn chưa thêm tòa nhà trọ nào. Nhấn nút phía trên để thêm mới!
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {myHouses.map(house => (
                        <div key={house.id} className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:bg-gray-50/50 transition-colors">
                          <div className="space-y-2">
                            <h4 className="font-heading font-black text-gray-900 text-lg">{house.name}</h4>
                            
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="font-bold">{house.address}</span>
                            </div>
                            
                            <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-xl">
                              {house.description || 'Không có mô tả chi tiết.'}
                            </p>
                          </div>

                          <div className="flex gap-2 shrink-0 w-full md:w-auto flex-wrap sm:flex-nowrap">
                            <Button 
                              onClick={() => handleOpenBulkRoomModal(house.id)}
                              variant="outline" 
                              size="sm" 
                              className="flex-1 md:flex-initial rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white font-black text-[10px] uppercase tracking-wider px-3.5 py-4"
                            >
                              ⚙️ Quản lý kiểu phòng
                            </Button>

                            <Button 
                              onClick={() => setShowUploadForm({ type: 'house', id: house.id })}
                              variant="outline" 
                              size="sm"
                              className="flex-1 md:flex-initial rounded-xl border-gray-200 text-gray-600 hover:text-gray-900 bg-white font-black text-[10px] uppercase tracking-wider px-3.5 py-4"
                            >
                              <ImageIcon className="w-3.5 h-3.5 mr-1" /> Sửa ảnh chính
                            </Button>
                            
                            <Button 
                              onClick={() => handleEditHouse(house)}
                              variant="outline" 
                              size="sm" 
                              className="flex-1 md:flex-initial rounded-xl border-gray-200 text-[#0075de] hover:bg-blue-50 bg-white font-black text-[10px] uppercase tracking-wider px-3.5 py-4"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                            </Button>
                            
                            <button
                              onClick={() => handleDeleteHouse(house.id)}
                              className="p-3 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95 shrink-0"
                              title="Xóa nhà"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Room Types List */}
              {activeTab === 'roomTypes' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center gap-4 flex-wrap">
                    <div>
                      <h3 className="font-heading font-black text-gray-900 text-lg">Danh sách các Loại phòng cho thuê</h3>
                      <p className="text-xs text-gray-400 font-bold mt-1">Quản lý bài trưng bày loại phòng Standard, Deluxe, Studio của bạn.</p>
                    </div>

                    <Button 
                      onClick={() => {
                        if (myHouses.length === 0) {
                          alert('Vui lòng thêm Nhà Trọ trước khi tạo Loại Phòng!');
                          return;
                        }
                        setSelectedHouseId(myHouses[0].id.toString());
                        setRoomName('');
                        setRoomPrice('');
                        setRoomArea('');
                        setRoomDesc('');
                        setRoomUtilities([]);
                        setRoomVideo('');
                        setEditingRoom(null);
                        setFormRooms([]);
                        setNewRoomInput('');
                        setShowRoomForm(true);
                      }}
                      className="bg-[#0075de] text-white hover:bg-opacity-95 rounded-xl px-5 py-5 font-black text-xs uppercase tracking-wider shadow-lg shadow-[#0075de]/15"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" /> Thêm loại phòng mới
                    </Button>
                  </div>

                  {myRoomTypes.length === 0 && myHouses.length === 0 ? (
                    <div className="text-center py-20 text-xs font-bold text-gray-400">
                      Bạn chưa thêm tòa nhà trọ nào. Hãy thêm tòa nhà trọ trước để có thể quản lý kiểu phòng!
                    </div>
                  ) : (
                    <div className="space-y-12 p-8">
                      {myHouses.map(house => {
                        const houseRooms = myRoomTypes.filter(room => room.boarding_house_id === house.id);
                        return (
                          <div key={house.id} className="border border-gray-100 rounded-xl p-8 bg-gray-50/30 space-y-6 bg-white shadow-sm">
                            {/* House Header */}
                            <div className="flex justify-between items-center border-b border-gray-50 pb-4 flex-wrap gap-4">
                              <div className="space-y-1">
                                <h4 className="font-heading font-black text-gray-900 text-base">{house.name}</h4>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-bold">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                                  <span>{house.address}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleOpenBulkRoomModal(house.id)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-none"
                                >
                                  ⚙️ Sửa nhanh hàng loạt
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedHouseId(house.id.toString());
                                    setRoomName('');
                                    setRoomPrice('');
                                    setRoomArea('');
                                    setRoomDesc('');
                                    setRoomUtilities([]);
                                    setRoomVideo('');
                                    setEditingRoom(null);
                                    setFormRooms([]);
                                    setNewRoomInput('');
                                    setShowRoomForm(true);
                                  }}
                                  className="bg-[#0075de]/10 hover:bg-[#0075de]/20 text-[#0075de] border-none rounded-xl px-4 py-2.5 font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all shadow-none"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Thêm kiểu đơn lẻ
                                </Button>
                              </div>
                            </div>

                            {/* Rooms List in House */}
                            {houseRooms.length === 0 ? (
                              <div className="text-center py-10 text-xs font-bold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                🏠 Tòa nhà này chưa có kiểu phòng nào. Bấm nút bên phải để thêm kiểu phòng!
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {houseRooms.map(room => (
                                  <div key={room.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:bg-gray-50/30 transition-colors">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                                          Diện tích: {room.area}m²
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                                          Tối đa {room.max_people} người
                                        </span>
                                      </div>
                                      
                                      <h5 className="font-heading font-black text-gray-900 text-sm">{room.name}</h5>
                                      
                                      <div className="text-xs font-black text-[#0075de]">
                                        Giá thuê: {room.price_from.toLocaleString('vi-VN')}đ / tháng
                                      </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                      <Button 
                                        onClick={() => handleEditRoom(room)}
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 sm:flex-initial rounded-xl border-gray-200 text-[#0075de] hover:bg-blue-50 bg-white font-black text-[10px] uppercase tracking-wider px-3.5 py-4"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                                      </Button>
                                      
                                      <button
                                        onClick={() => handleDeleteRoom(room.id)}
                                        className="p-3 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all active:scale-95"
                                        title="Xóa phòng"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* Global Dialog for Advanced Album Manager */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-4xl w-full bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 md:p-10 text-left animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-6">
              <div>
                <h3 className="text-xl font-heading font-black text-gray-900 tracking-tight">
                  {showUploadForm.type === 'house' ? 'Quản lý ảnh chính Tòa nhà' : 'Quản lý Album Hình ảnh'}
                </h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Đối tượng: {showUploadForm.type === 'house' 
                    ? `Tòa nhà trọ (Ảnh chính đại diện): ${myHouses.find(h => h.id === showUploadForm.id)?.name || 'Unknown'}` 
                    : `Kiểu phòng: ${myRoomTypes.find(rt => rt.id === showUploadForm.id)?.name || 'Unknown'}`
                  }
                </span>
              </div>
              <button 
                onClick={() => setShowUploadForm(null)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {showUploadForm.type === 'house' ? (
              // Two-column uploader for Boarding House main image
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Upload Form */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-heading font-black text-gray-900 text-xs uppercase tracking-wider mb-4">Tải ảnh đại diện mới</h4>
                    
                    <form onSubmit={handleImageUpload} className="space-y-4">
                      {/* Mode Toggle Tabs */}
                      <div className="flex bg-gray-200/60 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => { setUploadMode('file'); setUploadUrl(''); setUploadFilePreview(''); setUploadFile(null); }}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            uploadMode === 'file' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          📁 Tải từ máy
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode('url'); setUploadUrl(''); setUploadFilePreview(''); setUploadFile(null); }}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                            uploadMode === 'url' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          🔗 Nhập URL
                        </button>
                      </div>

                      {/* File Upload Mode */}
                      {uploadMode === 'file' ? (
                        <div className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="img-file-input"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('image/')) { alert('Vui lòng thả file hình ảnh!'); return; }
                              if (file.size > 10 * 1024 * 1024) { alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.'); return; }
                              setUploadFile(file);
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const b64 = ev.target?.result as string;
                                try {
                                  const compressed = await compressImage(b64);
                                  setUploadFilePreview(compressed);
                                  setUploadUrl(compressed);
                                } catch (err) {
                                  setUploadFilePreview(b64);
                                  setUploadUrl(b64);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center select-none ${
                              isDragOver
                                ? 'border-[#0075de] bg-blue-50/50 scale-[1.02]'
                                : 'border-gray-200 bg-white hover:border-[#0075de]'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-2xl bg-[#0075de]/5 border border-[#0075de]/10 text-[#0075de] flex items-center justify-center mb-2">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            {isDragOver ? (
                              <div className="flex flex-col items-center justify-center gap-1 animate-pulse">
                                <span className="text-[10px] font-black text-[#0075de]">Thả ảnh vào đây!</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] font-black text-gray-700">Kéo ảnh vào đây hoặc nhấn để chọn</span>
                                <span className="text-[8px] font-bold text-gray-400 block uppercase tracking-wider">JPG, PNG, WEBP — Tối đa 5MB</span>
                              </div>
                            )}
                          </div>

                          {uploadFilePreview && (
                            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between text-[8px] font-black text-[#0075de] uppercase tracking-wider">
                                <span>✓ Ảnh chuẩn bị cập nhật</span>
                                <button type="button" onClick={() => { setUploadFilePreview(''); setUploadFile(null); setUploadUrl(''); }} className="text-red-500 hover:underline">Xóa</button>
                              </div>
                              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white border border-indigo-200">
                                <img src={uploadFilePreview} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* URL Mode */
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Đường dẫn URL ảnh đại diện mới</label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              value={uploadUrl}
                              onChange={(e) => setUploadUrl(e.target.value)}
                              className="w-full bg-white border border-gray-200 focus:border-[#0075de] rounded-2xl px-3.5 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm"
                            />
                          </div>

                          {uploadUrl && !uploadUrl.startsWith('data:') && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between text-[8px] font-black text-green-600 uppercase tracking-wider">
                                <span>✓ Đã liên kết ảnh</span>
                                <button type="button" onClick={() => setUploadUrl('')} className="text-red-500 hover:underline">Xóa</button>
                              </div>
                              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white border border-green-200">
                                <img src={uploadUrl} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={!uploadUrl || isUploading}
                        className="w-full bg-[#0075de] hover:bg-opacity-95 text-white font-black h-12 rounded-2xl text-[10px] uppercase tracking-wider shadow-lg shadow-[#0075de]/15 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 mt-4"
                      >
                        {isUploading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...</>
                        ) : (
                          'Cập nhật ảnh đại diện'
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Active Cover Photo */}
                <div className="space-y-4">
                  <h4 className="font-heading font-black text-gray-900 text-xs uppercase tracking-wider">Hình ảnh đang hoạt động</h4>

                  {modalImagesBh.length > 0 ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#0075de] shadow-sm bg-white group">
                        <IDBImage src={modalImagesBh[0].image_url} alt="House Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDeleteModalBhImage(modalImagesBh[0].id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh hiện tại
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <span className="bg-[#e0e7ff] text-[#0075de] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          ✓ Ảnh đại diện chính của nhà trọ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-xs font-bold text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-white flex flex-col items-center justify-center gap-2">
                      <span>🏠 Chưa có ảnh đại diện nào.</span>
                      <span className="text-[10px] text-gray-400 font-medium">Vui lòng tải ảnh lên ở cột bên trái.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Direct Uploader Form */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-4">
                    <h4 className="font-heading font-black text-gray-900 text-xs uppercase tracking-wider">Tải ảnh đại diện mới</h4>
                  
                  <form onSubmit={handleImageUpload} className="space-y-4">
                    {/* Image position/order dropdown */}
                    {showUploadForm.type === 'room' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Vị trí hiển thị</label>
                        <select
                          value={uploadType}
                          onChange={(e) => setUploadType(e.target.value)}
                          required
                          className="w-full bg-white border border-gray-200 focus:border-[#0075de] rounded-2xl px-3.5 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm cursor-pointer"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={String(n)}>Ảnh {n}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Mode Toggle Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => { setUploadMode('file'); setUploadUrl(''); setUploadFilePreview(''); setUploadFile(null); }}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          uploadMode === 'file' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        📁 Tải từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUploadMode('url'); setUploadUrl(''); setUploadFilePreview(''); setUploadFile(null); }}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                          uploadMode === 'url' ? 'bg-white text-[#0075de] shadow-sm' : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        🔗 Nhập URL
                      </button>
                    </div>

                    {/* FILE UPLOAD MODE */}
                    {uploadMode === 'file' ? (
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="img-file-input"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragOver(false);
                            const file = e.dataTransfer.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith('image/')) { alert('Vui lòng thả file hình ảnh!'); return; }
                            if (file.size > 10 * 1024 * 1024) { alert('File quá lớn! Vui lòng chọn ảnh dưới 10MB.'); return; }
                            setUploadFile(file);
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const b64 = ev.target?.result as string;
                              try {
                                const compressed = await compressImage(b64);
                                setUploadFilePreview(compressed);
                                setUploadUrl(compressed);
                              } catch (err) {
                                setUploadFilePreview(b64);
                                setUploadUrl(b64);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 space-y-2 flex flex-col items-center select-none ${
                            isDragOver
                              ? 'border-[#0075de] bg-blue-50 scale-[1.02] shadow-lg shadow-blue-100'
                              : 'border-gray-200 bg-white hover:border-[#0075de] hover:bg-blue-50/30'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                            isDragOver
                              ? 'bg-[#0075de] text-white scale-110'
                              : 'bg-[#0075de]/5 border border-[#0075de]/10 text-[#0075de]'
                          }`}>
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div className="space-y-0.5">
                            {isDragOver ? (
                              <>
                                <p className="text-[11px] font-black text-[#0075de]">Thả ảnh vào đây!</p>
                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">Đang chẩn sẵn...</p>
                              </>
                            ) : (
                              <>
                                <p className="text-[11px] font-black text-gray-700">Kéo ảnh vào đây hoặc nhấn để chọn</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">JPG, PNG, WEBP — Tối đa 5MB</p>
                              </>
                            )}
                          </div>
                          {uploadFile && !isDragOver && (
                            <span className="text-[9px] font-black text-[#0075de] bg-blue-50 px-3 py-1 rounded-full truncate max-w-full">
                              ✓ {uploadFile.name}
                            </span>
                          )}
                        </div>

                        {uploadFilePreview && (
                          <div className="p-3 bg-green-50 border border-green-100 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-black text-green-600 uppercase tracking-wider">
                              <span>✓ Đã chọn ảnh</span>
                              <button type="button" onClick={() => { setUploadFile(null); setUploadFilePreview(''); setUploadUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-500 hover:underline">Xóa</button>
                            </div>
                            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white border border-green-200">
                              <img src={uploadFilePreview} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* URL INPUT MODE */
                      <div className="space-y-3">
                        <div
                          onClick={triggerQuickMockupUpload}
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-white hover:border-[#0075de] cursor-pointer transition-colors group active:scale-95 transform duration-150 flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#0075de] shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black text-gray-700">Lấy ảnh mẫu ngẫu nhiên</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Demo nhanh từ Unsplash</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Đường dẫn URL ảnh</label>
                          <input
                            type="url"
                            required
                            placeholder="https://images.unsplash.com/..."
                            value={uploadUrl}
                            onChange={(e) => setUploadUrl(e.target.value)}
                            className="w-full bg-white border border-gray-200 focus:border-[#0075de] rounded-2xl px-3.5 py-3 text-xs font-bold outline-none text-gray-700 shadow-sm"
                          />
                        </div>

                        {uploadUrl && (
                          <div className="p-3 bg-green-50 border border-green-100 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-black text-green-600 uppercase tracking-wider">
                              <span>✓ Đã liên kết ảnh</span>
                              <button type="button" onClick={() => setUploadUrl('')} className="text-red-500 hover:underline">Xóa</button>
                            </div>
                            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-white border border-green-200">
                              <img src={uploadUrl} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!uploadUrl || isUploading}
                      className="w-full bg-[#0075de] hover:bg-opacity-95 text-white font-black h-12 rounded-2xl text-[10px] uppercase tracking-wider shadow-lg shadow-[#0075de]/15 flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lên...</>
                      ) : (
                        'Đăng ảnh lên album'
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Right Column: Library manager cards */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-heading font-black text-gray-900 text-xs uppercase tracking-wider">Hình ảnh đang hoạt động</h4>

                {modalImagesRt.length === 0 ? (
                  <div className="text-center py-20 text-xs font-bold text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    Chưa có ảnh nào trong album kiểu phòng này. Hãy đăng ảnh ở bảng bên trái!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                    {modalImagesRt.sort((a, b) => a.sort_order - b.sort_order).map((img, idx) => {
                      const isMain = img.image_type === 'main';
                      return (
                        <Card key={`modal-rt-img-${img.id}`} className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white shrink-0 transition-all ${
                          isMain ? 'border-[#0075de] ring-1 ring-[#0075de]' : 'border-gray-100'
                        }`}>
                          <div className="group relative aspect-[16/10] w-full bg-gray-50 overflow-hidden">
                            <IDBImage src={img.image_url} alt="Room" className="w-full h-full object-cover" />
                            
                            {/* Main Image Badge */}
                            {isMain && (
                              <span className="absolute top-2.5 left-2.5 bg-[#0075de] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                                <Star className="w-2.5 h-2.5 fill-current text-yellow-400" /> Ảnh chính
                              </span>
                            )}

                            {/* Hover delete button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleDeleteModalRtImage(img.id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-90"
                                title="Xóa ảnh vĩnh viễn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                            {/* Position selector */}
                            <div className="space-y-0.5">
                              <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Vị trí hiển thị</label>
                              <select
                                value={String(img.sort_order ?? idx + 1)}
                                onChange={(e) => handleUpdateModalRtImageCategory(img.id, String(Number(e.target.value)))}
                                className="w-full bg-gray-50 border border-gray-100 focus:border-[#0075de] rounded-xl px-2 py-1 text-[10px] font-black text-gray-700 outline-none cursor-pointer"
                              >
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <option key={n} value={String(n)}>
                                    Ảnh {n} {n === 1 ? '(Ảnh lớn bên trái)' :
                                              n === 2 ? '(Ảnh nhỏ trên-trái)' :
                                              n === 3 ? '(Ảnh nhỏ trên-phải)' :
                                              n === 4 ? '(Ảnh nhỏ dưới-trái)' :
                                              n === 5 ? '(Ảnh nhỏ dưới-phải)' :
                                              '(Xem tất cả)'}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Set as Main Quick Button */}
                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => handleSetModalRtImageAsMain(img.id)}
                                className="w-full border border-gray-200 text-gray-500 hover:border-[#0075de] hover:text-[#0075de] rounded-xl py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95"
                              >
                                <Star className="w-3 h-3 fill-current" /> Đặt làm ảnh chính
                              </button>
                            )}

                            <div className="flex items-center justify-between pt-1.5 border-t border-gray-50 mt-auto">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black text-slate-700 uppercase">Vị trí hiện tại: {img.sort_order || idx + 1}</span>
                                <span className="text-[8px] font-bold text-slate-500">
                                  {Number(img.sort_order || idx + 1) === 1 ? '• Ảnh lớn bên trái' :
                                   Number(img.sort_order || idx + 1) === 2 ? '• Ảnh nhỏ trên-trái' :
                                   Number(img.sort_order || idx + 1) === 3 ? '• Ảnh nhỏ trên-phải' :
                                   Number(img.sort_order || idx + 1) === 4 ? '• Ảnh nhỏ dưới-trái' :
                                   Number(img.sort_order || idx + 1) === 5 ? '• Ảnh nhỏ dưới-phải' :
                                   '• Chỉ hiện trong "Xem tất cả"'}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveModalRtImageOrder(img.id, 'up')}
                                  className="p-1 px-2.5 rounded-lg border border-gray-200 text-xs font-bold bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  ←
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === modalImagesRt.length - 1}
                                  onClick={() => handleMoveModalRtImageOrder(img.id, 'down')}
                                  className="p-1 px-2.5 rounded-lg border border-gray-200 text-xs font-bold bg-white text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── MOCK GOOGLE AUTHENTICATION DIALOG ── */}
    {showMockGoogleModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 md:p-10 text-left animate-in zoom-in-95 duration-200 relative my-8">
          <button
            onClick={() => setShowMockGoogleModal(false)}
            className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>

          {mockGoogleMode === 'login' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight">Đăng nhập Mock Google</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chế độ giả lập • Chọn tài khoản bên dưới</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {mockGoogleAccounts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                    Chưa có tài khoản Mock Google nào.
                  </div>
                ) : (
                  mockGoogleAccounts.map((acc) => {
                    const isGoogle = acc.email.includes('mockgoogle_') || acc.email.includes('google') || acc.id.includes('google');
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleSelectMockGoogleUser(acc)}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/20 cursor-pointer active:scale-[0.99] transition-all group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors">
                              {acc.name}
                            </span>
                            {isGoogle && (
                              <span className="bg-blue-50 text-[8px] font-black text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Google
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">{acc.email}</div>
                        </div>
                        
                        <div>
                          {acc.status === 'pending' && (
                            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                              Chờ duyệt
                            </span>
                          )}
                          {acc.status === 'rejected' && (
                            <span className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                              Từ chối
                            </span>
                          )}
                          {acc.status === 'active' && (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                              Đã duyệt
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setMockGoogleMode('register');
                    setMockGoogleEmail(`mockgoogle_${Date.now()}@gmail.com`);
                    setMockGoogleName('Chủ Trọ Google (Mock)');
                    setMockGooglePhone('09' + Math.floor(10000000 + Math.random() * 90000000));
                  }}
                  className="text-xs font-black text-[#0075de] hover:underline"
                >
                  Đăng ký tài khoản Mock Google mới
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterMockGoogle} className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 tracking-tight">Đăng ký Mock Google</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chế độ giả lập • Thiết lập tài khoản Google</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tên chủ trọ *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-blue-500 focus-within:bg-white rounded-2xl px-4 py-3">
                    <User className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input
                      type="text"
                      required
                      value={mockGoogleName}
                      onChange={(e) => setMockGoogleName(e.target.value)}
                      placeholder="Chủ Trọ Google (Mock)"
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Địa chỉ Email *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-blue-500 focus-within:bg-white rounded-2xl px-4 py-3">
                    <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input
                      type="email"
                      required
                      value={mockGoogleEmail}
                      onChange={(e) => setMockGoogleEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số điện thoại *</label>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200/80 focus-within:border-blue-500 focus-within:bg-white rounded-2xl px-4 py-3">
                    <Phone className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                    <input
                      type="text"
                      required
                      value={mockGooglePhone}
                      onChange={(e) => setMockGooglePhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl h-12 font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md"
              >
                Xác nhận Đăng ký Mock Google
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMockGoogleMode('login');
                    refreshMockGoogleAccounts();
                  }}
                  className="text-xs font-black text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Đã có tài khoản? Quay lại Đăng nhập
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}
    </div>
  );
}
