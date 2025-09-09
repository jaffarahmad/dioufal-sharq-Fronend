import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/theme-context";
import {
  User,
  Building,
  Palette,
  Settings as SettingsIcon,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Globe,
  Bell,
  Database,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Check,
  X,
} from "lucide-react";

// Types
interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface CompanyInfo {
  companyName: string;
  logo?: string;
  registrationId: string;
  vatNumber: string;
  email: string;
  phone: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  currency: string;
  timezone: string;
  fiscalYearStart: string;
}

interface UserPreferences {
  theme: "light" | "dark" | "system";
  primaryColor: string;
  sidebarDensity: "comfortable" | "compact";
  cornerRadius: "md" | "xl" | "2xl";
}

interface SystemSettings {
  language: string;
  dateFormat: string;
  numberFormat: string;
  defaultTimezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Additional form data types
interface UsernameChangeData {
  currentPassword: string;
  newUsername: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileFormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
}

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface ValidationError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

// Validation schemas
const ValidationSchemas = {
  username: {
    minLength: 3,
    maxLength: 24,
    pattern: /^[a-zA-Z0-9_]+$/,
    validate: (value: string) => {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Username must be at least 3 characters';
      if (value.length > 24) return 'Username must be less than 24 characters';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
      if (value.includes(' ')) return 'Username cannot contain spaces';
      return null;
    }
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
    validate: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!/(?=.*[A-Za-z])/.test(value)) return 'Password must contain at least one letter';
      if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
      return null;
    }
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    validate: (value: string) => {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
      return null;
    }
  },
  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    validate: (value: string) => {
      if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value)) return 'Please enter a valid phone number';
      return null;
    }
  },
  companyName: {
    minLength: 2,
    maxLength: 100,
    validate: (value: string) => {
      if (!value) return 'Company name is required';
      if (value.length < 2) return 'Company name must be at least 2 characters';
      if (value.length > 100) return 'Company name must be less than 100 characters';
      return null;
    }
  },
  registrationId: {
    minLength: 5,
    maxLength: 50,
    validate: (value: string) => {
      if (!value) return 'Registration ID is required';
      if (value.length < 5) return 'Registration ID must be at least 5 characters';
      if (value.length > 50) return 'Registration ID must be less than 50 characters';
      return null;
    }
  }
};

// File upload validation
const FileValidation = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    validate: (file: File) => {
      if (file.size > 2 * 1024 * 1024) return 'File size must be less than 2MB';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        return 'Only JPEG, PNG, and WebP images are allowed';
      }
      return null;
    }
  },
  logo: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    validate: (file: File) => {
      if (file.size > 2 * 1024 * 1024) return 'File size must be less than 2MB';
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        return 'Only JPEG, PNG, WebP, and SVG images are allowed';
      }
      return null;
    }
  }
};

const NAVIGATION_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System", icon: SettingsIcon },
];

const COLOR_SWATCHES = [
  { name: "Blue", value: "blue", color: "bg-blue-500", hex: "#3b82f6" },
  { name: "Indigo", value: "indigo", color: "bg-indigo-500", hex: "#6366f1" },
  { name: "Purple", value: "purple", color: "bg-purple-500", hex: "#a855f7" },
  { name: "Pink", value: "pink", color: "bg-pink-500", hex: "#ec4899" },
  { name: "Red", value: "red", color: "bg-red-500", hex: "#ef4444" },
  { name: "Orange", value: "orange", color: "bg-orange-500", hex: "#f97316" },
  { name: "Yellow", value: "yellow", color: "bg-yellow-500", hex: "#eab308" },
  { name: "Green", value: "green", color: "bg-green-500", hex: "#22c55e" },
  { name: "Emerald", value: "emerald", color: "bg-emerald-500", hex: "#10b981" },
  { name: "Teal", value: "teal", color: "bg-teal-500", hex: "#14b8a6" },
];

export default function Settings() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [isDirty, setIsDirty] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    avatar: ''
  });
  
  // Username change state
  const [usernameData, setUsernameData] = useState({
    currentPassword: '',
    newUsername: ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || 0,
    fullName: user?.firstName + " " + user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: "",
    avatar: undefined,
  });

  const [usernameChange, setUsernameChange] = useState({
    currentPassword: "",
    newUsername: "",
  });

  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [company, setCompany] = useState<CompanyInfo>({
    companyName: "AMANI MUHAMMAD AL OTAIBI CON.COM",
    registrationId: "7050857452",
    vatNumber: "312169201500003",
    email: "info@amani-alotaibi.com",
    phone: "+966 11 234 5678",
    website: "www.amani-alotaibi.com",
    address: {
      street: "",
      city: "Riyadh",
      state: "Riyadh Province",
      zip: "",
      country: "Saudi Arabia",
    },
    currency: "SAR",
    timezone: "Asia/Riyadh",
    fiscalYearStart: "01-01",
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme,
    primaryColor: "blue",
    sidebarDensity: "comfortable",
    cornerRadius: "xl",
  });

  // Fetch user preferences from backend
  const { data: userPreferences } = useQuery<UserPreferences>({
    queryKey: ["user-preferences"],
    enabled: !!token, // Only run query if token exists
    queryFn: () => apiRequest("/api/user/preferences", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  });

  // Update preferences when data is loaded
  useEffect(() => {
    if (userPreferences) {
      setPreferences(userPreferences);
    }
  }, [userPreferences]);

  // Sync preferences with theme context
  useEffect(() => {
    setPreferences(prev => {
      if (prev.theme !== theme) {
        return { ...prev, theme };
      }
      return prev;
    });
  }, [theme]);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    language: "en",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "1,234.56",
    defaultTimezone: "Asia/Riyadh",
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const response = await apiRequest("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated successfully",
        duration: 1000,
      });
      setIsDirty(false);
    },
  });

  const saveUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save user settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated successfully',
        duration: 1000,
      });
      setIsDirty(false);
    },
    onError: () => {
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
        duration: 1000,
      });
    },
  });
  
  const changeUsernameMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newUsername: string }) => {
      const response = await fetch('/api/users/me/username', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change username');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Username updated successfully',
        duration: 1000,
      });
      setUsernameData({ currentPassword: '', newUsername: '' });
      setProfileData(prev => ({ ...prev, username: data.username }));
      // Update token if new one is provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
    },
    onError: (error: any) => {
      toast({
        title: error.message || 'Failed to update username',
        variant: 'destructive',
        duration: 1000,
      });
    },
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password updated successfully',
        duration: 1000,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast({
        title: error.message || 'Failed to update password',
        variant: 'destructive',
        duration: 1000,
      });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newUsername: string }) => {
      const response = await apiRequest("/api/users/me/username", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update username");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Username updated successfully",
        duration: 1000,
      });
      setUsernameChange({ currentPassword: "", newUsername: "" });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("/api/users/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated successfully",
        duration: 1000,
      });
      setPasswordChange({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyInfo) => {
      const response = await apiRequest("/api/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update company info");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company information updated successfully",
        duration: 1000,
      });
      setIsDirty(false);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: UserPreferences) => {
      const response = await apiRequest("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated successfully",
        duration: 1000,
      });
      setIsDirty(false);
    },
  });

  const updateSystemMutation = useMutation({
    mutationFn: async (data: SystemSettings) => {
      const response = await apiRequest("/api/system/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update system settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "System settings updated successfully",
        duration: 1000,
      });
      setIsDirty(false);
    },
  });

  // Handlers
  const handleSave = () => {
    switch (activeSection) {
      case "profile":
        updateProfileMutation.mutate(profile);
        break;
      case "company":
        updateCompanyMutation.mutate(company);
        break;
      case "appearance":
        updatePreferencesMutation.mutate(preferences);
        break;
      case "system":
        updateSystemMutation.mutate(systemSettings);
        break;
    }
  };

  const handleCancel = () => {
    // Reset all forms to original state
    setProfile({
      id: user?.id || 0,
      fullName: user?.firstName + " " + user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: "",
      avatar: undefined,
    });
    
    setProfileData({
      fullName: user?.firstName + " " + user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: "",
      avatar: ""
    });
    
    setUsernameData({
      currentPassword: "",
      newUsername: ""
    });
    
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    
    setUsernameChange({
      currentPassword: "",
      newUsername: "",
    });
    
    setPasswordChange({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    
    // Reset company, preferences, and system settings would need initial values
    // For now, just mark as not dirty
    setIsDirty(false);
  };

  // Validation helpers
  const validateProfileField = (field: keyof ProfileFormData, value: string): string | null => {
    switch (field) {
      case 'email':
        return ValidationSchemas.email.validate(value);
      case 'phone':
        return ValidationSchemas.phone.validate(value);
      default:
        return null;
    }
  };

  const validateCompanyField = (field: keyof CompanyInfo, value: string): string | null => {
    switch (field) {
      case 'companyName':
        return ValidationSchemas.companyName.validate(value);
      case 'registrationId':
        return ValidationSchemas.registrationId.validate(value);
      case 'email':
        return ValidationSchemas.email.validate(value);
      case 'phone':
        return ValidationSchemas.phone.validate(value);
      default:
        return null;
    }
  };

  // Enhanced form handlers with validation
  const handleProfileFieldChange = (field: keyof ProfileFormData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setProfileData(prev => ({ ...prev, [field]: value }));
    
    // Validate field
    const error = validateProfileField(field, value);
    if (error) {
      toast({
        title: error,
        variant: 'destructive',
        duration: 1000,
      });
    }
    
    setIsDirty(true);
  };

  const handleCompanyFieldChange = (field: keyof CompanyInfo, value: string) => {
    setCompany(prev => ({ ...prev, [field]: value }));
    
    // Validate field
    const error = validateCompanyField(field, value);
    if (error) {
      toast({
        title: error,
        variant: 'destructive',
        duration: 1000,
      });
    }
    
    setIsDirty(true);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameChange.currentPassword || !usernameChange.newUsername) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (usernameChange.newUsername.length < 3 || usernameChange.newUsername.length > 24) {
      toast({
        title: "Username must be between 3 and 24 characters",
        variant: "destructive",
      });
      return;
    }
    if (usernameChange.newUsername.includes(" ")) {
      toast({
        title: "Username cannot contain spaces",
        variant: "destructive",
      });
      return;
    }
    updateUsernameMutation.mutate(usernameChange);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChange.currentPassword || !passwordChange.newPassword || !passwordChange.confirmPassword) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast({
        title: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (passwordChange.newPassword.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(passwordChange.newPassword);
    const hasNumber = /\d/.test(passwordChange.newPassword);
    if (!hasLetter || !hasNumber) {
      toast({
        title: "Password must contain at least 1 letter and 1 number",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordChange.currentPassword,
      newPassword: passwordChange.newPassword,
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file using schema
    const fileError = FileValidation.avatar.validate(file);
    if (fileError) {
      toast({
        title: fileError,
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload avatar');
      
      const data = await response.json();
      setProfileData(prev => ({ ...prev, avatar: data.avatarUrl }));
      setProfile(prev => ({ ...prev, avatar: data.avatarUrl }));
      setIsDirty(true);
      
      toast({
        title: 'Avatar updated successfully',
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Failed to upload avatar',
        variant: 'destructive',
        duration: 1000,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (hasLetter && hasNumber && hasSpecial && password.length >= 12) return 'strong';
    if (hasLetter && hasNumber && password.length >= 8) return 'medium';
    return 'weak';
  };
  
  const handleAvatarChange = handleAvatarUpload;
  
  const handleUsernameChange = () => {
    // Validate current password
    if (!usernameData.currentPassword) {
      toast({
        title: 'Current password is required',
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    // Validate new username using schema
    const usernameError = ValidationSchemas.username.validate(usernameData.newUsername);
    if (usernameError) {
      toast({
        title: usernameError,
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    changeUsernameMutation.mutate({
      currentPassword: usernameData.currentPassword,
      newUsername: usernameData.newUsername,
    });
  };
  
  const handlePasswordChange = () => {
    // Validate current password
    if (!passwordData.currentPassword) {
      toast({
        title: 'Current password is required',
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    // Validate new password using schema
    const passwordError = ValidationSchemas.password.validate(passwordData.newPassword);
    if (passwordError) {
      toast({
        title: passwordError,
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file using schema
    const fileError = FileValidation.logo.validate(file);
    if (fileError) {
      toast({
        title: fileError,
        variant: 'destructive',
        duration: 1000,
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await fetch('/api/company/logo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload logo');
      
      const data = await response.json();
      setCompany(prev => ({ ...prev, logo: data.logoUrl }));
      setIsDirty(true);
      
      toast({
        title: 'Company logo updated successfully',
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Failed to upload logo',
        variant: 'destructive',
        duration: 1000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Live preview for appearance changes
  useEffect(() => {
    if (preferences.theme !== theme) {
      setTheme(preferences.theme);
    }
  }, [preferences.theme, theme, setTheme]);

  // System handlers
  const handleDataExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/system/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ format }),
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: `Data exported successfully as ${format.toUpperCase()}`,
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Failed to export data',
        variant: 'destructive',
        duration: 1000,
      });
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/system/cache/clear', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Cache clear failed');
      
      toast({
        title: 'Cache cleared successfully',
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Failed to clear cache',
        variant: 'destructive',
        duration: 1000,
      });
    }
  };

  const handleBackupData = async () => {
    try {
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Backup failed');
      
      toast({
        title: 'Data backup created successfully',
        duration: 1000,
      });
    } catch (error) {
      toast({
        title: 'Failed to create backup',
        variant: 'destructive',
        duration: 1000,
      });
    }
  };

  const handleDeleteAccount = () => {
    // This should open a confirmation modal with password re-auth
    toast({
      title: 'Delete account functionality requires confirmation modal',
      variant: 'destructive',
      duration: 1000,
    });
  };

  const handleResetOrganization = () => {
    // This should open a confirmation modal with password re-auth
    toast({
      title: 'Reset organization functionality requires confirmation modal',
      variant: 'destructive',
      duration: 1000,
    });
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar Upload */}
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-slate-500">Upload a new avatar. Max size 2MB.</p>
              </div>
            </div>

            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) => {
                  setProfile(prev => ({ ...prev, fullName: e.target.value }));
                  setIsDirty(true);
                }}
                className="mt-1 rounded-full"
              />
            </div>

            <div>
              <Label htmlFor="displayUsername">Username</Label>
              <Input
                id="displayUsername"
                value={profile.username}
                disabled
                className="mt-1 rounded-full bg-slate-50"
                placeholder="Username (change below)"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => {
                  setProfile(prev => ({ ...prev, email: e.target.value }));
                  setIsDirty(true);
                }}
                className="mt-1 rounded-full"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => {
                  setProfile(prev => ({ ...prev, phone: e.target.value }));
                  setIsDirty(true);
                }}
                className="mt-1 rounded-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Username Change */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Change Username</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPasswordUsername">Current Password</Label>
              <Input
                id="currentPasswordUsername"
                type="password"
                value={usernameChange.currentPassword}
                onChange={(e) => setUsernameChange(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="mt-1 rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="newUsername">New Username</Label>
              <Input
                id="newUsername"
                value={usernameChange.newUsername}
                onChange={(e) => setUsernameChange(prev => ({ ...prev, newUsername: e.target.value }))}
                className="mt-1 rounded-full"
                placeholder="Enter new username"
              />
              {usernameChange.newUsername && (
                <p className="text-sm text-slate-500 mt-1">Preview: @{usernameChange.newUsername}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={updateUsernameMutation.isPending}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              {updateUsernameMutation.isPending ? "Updating..." : "Update Username"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordChange.currentPassword}
                  onChange={(e) => setPasswordChange(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1 rounded-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordChange.newPassword}
                  onChange={(e) => setPasswordChange(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 rounded-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordChange.confirmPassword}
                  onChange={(e) => setPasswordChange(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 rounded-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompanySection = () => (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Company Information</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="md:col-span-2 flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img src={company.logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium">Company Logo</h3>
              <p className="text-sm text-slate-500">Upload company logo. Max size 2MB, optimized to 512px.</p>
            </div>
          </div>

          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={company.companyName}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, companyName: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="registrationId">Registration/Tax ID</Label>
            <Input
              id="registrationId"
              value={company.registrationId}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, registrationId: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={company.email}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, email: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="companyPhone">Phone</Label>
            <Input
              id="companyPhone"
              value={company.phone}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, phone: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={company.website}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, website: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
            />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={company.currency}
              onValueChange={(value) => {
                setCompany(prev => ({ ...prev, currency: value }));
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="mt-1 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={company.timezone}
              onValueChange={(value) => {
                setCompany(prev => ({ ...prev, timezone: value }));
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="mt-1 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
            <Input
              id="fiscalYearStart"
              value={company.fiscalYearStart}
              onChange={(e) => {
                setCompany(prev => ({ ...prev, fiscalYearStart: e.target.value }));
                setIsDirty(true);
              }}
              className="mt-1 rounded-full"
              placeholder="MM-DD"
            />
          </div>

          {/* Address Fields */}
          <div className="md:col-span-2">
            <Label>Address</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Input
                  placeholder="Street"
                  value={company.address.street}
                  onChange={(e) => {
                    setCompany(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }));
                    setIsDirty(true);
                  }}
                  className="rounded-full"
                />
              </div>
              <div>
                <Input
                  placeholder="City"
                  value={company.address.city}
                  onChange={(e) => {
                    setCompany(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }));
                    setIsDirty(true);
                  }}
                  className="rounded-full"
                />
              </div>
              <div>
                <Input
                  placeholder="State/Province"
                  value={company.address.state}
                  onChange={(e) => {
                    setCompany(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }));
                    setIsDirty(true);
                  }}
                  className="rounded-full"
                />
              </div>
              <div>
                <Input
                  placeholder="ZIP/Postal Code"
                  value={company.address.zip}
                  onChange={(e) => {
                    setCompany(prev => ({
                      ...prev,
                      address: { ...prev.address, zip: e.target.value }
                    }));
                    setIsDirty(true);
                  }}
                  className="rounded-full"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  placeholder="Country"
                  value={company.address.country}
                  onChange={(e) => {
                    setCompany(prev => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value }
                    }));
                    setIsDirty(true);
                  }}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Theme & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selection */}
            <div>
              <Label>Theme</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "system", icon: Monitor, label: "System" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setTheme(value as any);
                      setPreferences(prev => ({ ...prev, theme: value as any }));
                      setIsDirty(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                      theme === value
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <Label>Primary Color</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setPreferences(prev => ({ ...prev, primaryColor: color.value }));
                      setIsDirty(true);
                    }}
                    className={`relative w-10 h-10 rounded-full ${color.color} transition-transform hover:scale-110`}
                    title={color.name}
                  >
                    {preferences.primaryColor === color.value && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Density */}
            <div>
              <Label>Sidebar Density</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setPreferences(prev => ({ ...prev, sidebarDensity: value as any }));
                      setIsDirty(true);
                    }}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      preferences.sidebarDensity === value
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div>
              <Label>Corner Radius</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: "md", label: "Medium" },
                  { value: "xl", label: "Large" },
                  { value: "2xl", label: "Extra Large" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setPreferences(prev => ({ ...prev, cornerRadius: value as any }));
                      setIsDirty(true);
                    }}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      preferences.cornerRadius === value
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Area */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 transition-colors">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Preview of your appearance settings:</p>
            <div className="space-y-2">
              <div 
                className={`p-3 text-white transition-all ${
                  preferences.cornerRadius === 'md' ? 'rounded-md' :
                  preferences.cornerRadius === 'xl' ? 'rounded-xl' : 'rounded-2xl'
                }`}
                style={{ 
                  backgroundColor: COLOR_SWATCHES.find(c => c.value === preferences.primaryColor)?.hex || '#3b82f6'
                }}
              >
                Primary Color Sample ({preferences.primaryColor})
              </div>
              <div className={`p-2 bg-white dark:bg-slate-700 border dark:border-slate-600 text-sm transition-colors ${
                preferences.cornerRadius === 'md' ? 'rounded-md' :
                preferences.cornerRadius === 'xl' ? 'rounded-xl' : 'rounded-2xl'
              }`}>
                <span className="text-slate-900 dark:text-slate-100">Corner Radius: {preferences.cornerRadius}</span>
              </div>
              <div className={`p-2 bg-white dark:bg-slate-700 border dark:border-slate-600 text-sm transition-colors ${
                preferences.cornerRadius === 'md' ? 'rounded-md' :
                preferences.cornerRadius === 'xl' ? 'rounded-xl' : 'rounded-2xl'
              }`}>
                <span className="text-slate-900 dark:text-slate-100">Sidebar Density: {preferences.sidebarDensity}</span>
              </div>
              <div className={`p-2 bg-white dark:bg-slate-700 border dark:border-slate-600 text-sm transition-colors ${
                preferences.cornerRadius === 'md' ? 'rounded-md' :
                preferences.cornerRadius === 'xl' ? 'rounded-xl' : 'rounded-2xl'
              }`}>
                <span className="text-slate-900 dark:text-slate-100">Current Theme: {theme} {theme === 'system' ? `(${actualTheme})` : ''}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemSection = () => (
    <div className="space-y-6">
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={systemSettings.language}
                onValueChange={(value) => {
                  setSystemSettings(prev => ({ ...prev, language: value }));
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className="mt-1 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={systemSettings.dateFormat}
                onValueChange={(value) => {
                  setSystemSettings(prev => ({ ...prev, dateFormat: value }));
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className="mt-1 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numberFormat">Number Format</Label>
              <Select
                value={systemSettings.numberFormat}
                onValueChange={(value) => {
                  setSystemSettings(prev => ({ ...prev, numberFormat: value }));
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className="mt-1 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,234.56">1,234.56</SelectItem>
                  <SelectItem value="1.234,56">1.234,56</SelectItem>
                  <SelectItem value="1 234.56">1 234.56</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultTimezone">Default Timezone</Label>
              <Select
                value={systemSettings.defaultTimezone}
                onValueChange={(value) => {
                  setSystemSettings(prev => ({ ...prev, defaultTimezone: value }));
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className="mt-1 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[
              { key: "email", label: "Email Notifications", icon: Bell },
              { key: "sms", label: "SMS Notifications", icon: Bell },
              { key: "push", label: "Push Notifications", icon: Bell },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <Label>{label}</Label>
                </div>
                <Switch
                  checked={systemSettings.notifications[key as keyof typeof systemSettings.notifications]}
                  onCheckedChange={(checked) => {
                    setSystemSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, [key]: checked }
                    }));
                    setIsDirty(true);
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-slate-500">Download your data in CSV or JSON format</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => handleDataExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => handleDataExport('json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Clear Cache</h4>
                <p className="text-sm text-slate-500">Clear application cache and temporary files</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleClearCache}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Backup Data</h4>
                <p className="text-sm text-slate-500">Create a backup of your data</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleBackupData}
              >
                <Database className="w-4 h-4 mr-2" />
                Backup Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="rounded-xl border border-red-200 bg-red-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-700">Delete Account</h4>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-700">Reset Organization</h4>
                <p className="text-sm text-red-600">Reset all organization data to defaults</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full"
                onClick={handleResetOrganization}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Organization
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "company":
        return renderCompanySection();
      case "appearance":
        return renderAppearanceSection();
      case "system":
        return renderSystemSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen">
        {/* Left Navigation */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {NAVIGATION_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            {renderContent()}
          </div>

          {/* Sticky Action Bar */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={!isDirty}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || updateProfileMutation.isPending || updateCompanyMutation.isPending || updatePreferencesMutation.isPending || updateSystemMutation.isPending}
                className="rounded-full bg-blue-500 hover:bg-blue-600"
              >
                {(updateProfileMutation.isPending || updateCompanyMutation.isPending || updatePreferencesMutation.isPending || updateSystemMutation.isPending) ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
