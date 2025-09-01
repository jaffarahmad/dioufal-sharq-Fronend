import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/theme-context";
import {
  Settings as SettingsIcon,
  User,
  Building,
  Palette,
  Shield,
  Bell,
  Globe,
  Database,
  Save,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Camera,
  Lock,
  Mail,
  Edit,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface UserSettings {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    reports: boolean;
    projects: boolean;
  };
}

interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  dateFormat: string;
  fiscalYearStart: string;
  logo?: string;
}

interface SystemSettings {
  autoBackup: boolean;
  backupFrequency: string;
  dataRetention: number;
  sessionTimeout: number;
  twoFactorAuth: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { user, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const { theme: currentTheme, setTheme } = useTheme();

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Email change form state
  const [emailData, setEmailData] = useState({
    newEmail: "",
    password: "",
  });

  // Profile update form state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  // Username change form state
  const [usernameData, setUsernameData] = useState({
    newUsername: "",
    password: "",
  });

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: "1",
    name: "Ahmed Al-Saudi",
    email: "ahmed@diouf-alsharq.com",
    role: "Project Manager",
    theme: "system",
    language: "en",
    timezone: "Asia/Riyadh",
    notifications: {
      email: true,
      push: true,
      reports: true,
      projects: true,
    },
  });

  // Company settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: "DIOUF AL-SHARQ GENERAL CONTRACTING COMPANY",
    address: "Riyadh, Saudi Arabia",
    phone: "+966 11 234 5678",
    email: "info@diouf-alsharq.com",
    website: "www.diouf-alsharq.com",
    currency: "SAR",
    dateFormat: "DD/MM/YYYY",
    fiscalYearStart: "01/01",
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: 365,
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
    },
  });

  // Save user settings mutation
  const saveUserMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      // API call to save user settings
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your profile settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save company settings mutation
  const saveCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettings) => {
      // API call to save company settings
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Company Settings Updated",
        description: "Company information has been saved successfully.",
      });
    },
  });

  // Save system settings mutation
  const saveSystemMutation = useMutation({
    mutationFn: async (data: SystemSettings) => {
      // API call to save system settings
      return data;
    },
    onSuccess: () => {
      toast({
        title: "System Settings Updated",
        description: "System configuration has been saved successfully.",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiRequest("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change email mutation
  const changeEmailMutation = useMutation({
    mutationFn: async (data: { newEmail: string; password: string }) => {
      const response = await apiRequest("/api/auth/change-email", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change email");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Changed",
        description: "Your email has been updated successfully.",
      });
      setEmailData({ newEmail: "", password: "" });
      refreshUser(); // Refresh user data
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change username mutation
  const changeUsernameMutation = useMutation({
    mutationFn: async (data: { newUsername: string; password: string }) => {
      const response = await apiRequest("/api/auth/change-username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change username");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Username Changed",
        description: "Your username has been updated successfully.",
      });
      setUsernameData({ newUsername: "", password: "" });
      refreshUser(); // Refresh user data
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await apiRequest("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      refreshUser(); // Refresh user data
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailData.newEmail || !emailData.password) {
      toast({
        title: "Error",
        description: "Please fill in all email change fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.newEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    changeEmailMutation.mutate({
      newEmail: emailData.newEmail,
      password: emailData.password,
    });
  };

  const handleUsernameChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usernameData.newUsername || !usernameData.password) {
      toast({
        title: "Error",
        description: "Please fill in all username change fields.",
        variant: "destructive",
      });
      return;
    }

    if (usernameData.newUsername.length < 3) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Basic username validation (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameData.newUsername)) {
      toast({
        title: "Error",
        description:
          "Username can only contain letters, numbers, and underscores.",
        variant: "destructive",
      });
      return;
    }

    changeUsernameMutation.mutate({
      newUsername: usernameData.newUsername,
      password: usernameData.password,
    });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.firstName || !profileData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in both first name and last name.",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    });
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setTheme(theme);
    setUserSettings(prev => ({ ...prev, theme }));
  };

  const handleBackupNow = () => {
    toast({
      title: "Backup Started",
      description:
        "System backup has been initiated. You'll be notified when complete.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description:
        "Data export is being prepared. Download will begin shortly.",
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage your account, company, and system preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-optimized tab list */}
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="profile"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sm:hidden">Profile</span>
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="company"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sm:hidden">Company</span>
                <span className="hidden sm:inline">Company</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sm:hidden">Theme</span>
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger
                value="system"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sm:hidden">System</span>
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4 sm:space-y-6">
            <Card className="border-0 sm:border shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-6">
                {/* Administrator Information */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    Current Administrator
                  </h3>

                  <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                            Updated Administrator
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {user?.email || "newemail@diouf-alsharq.com"}
                          </p>
                        </div>
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                          Active
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Profile Picture Upload */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    Profile Picture
                  </h3>

                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6">
                    {/* Current Picture Display */}
                    <div className="flex flex-col items-center space-y-3">
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        onDragOver={e => {
                          e.preventDefault();
                          e.currentTarget.classList.add(
                             "border-gray-400",
                             "bg-gray-50",
                             "dark:bg-gray-900/20"
                           );
                        }}
                        onDragLeave={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove(
                            "border-gray-400",
                            "bg-gray-50",
                            "dark:bg-gray-900/20"
                          );
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          e.currentTarget.classList.remove(
                            "border-gray-400",
                            "bg-gray-50",
                            "dark:bg-gray-900/20"
                          );
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = event => {
                              setUserSettings(prev => ({
                                ...prev,
                                avatar: event.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onClick={() =>
                          document.getElementById("avatarUpload")?.click()
                        }
                      >
                        {userSettings.avatar ? (
                          <img
                            src={userSettings.avatar}
                            alt="Profile Picture"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current Picture
                      </p>
                    </div>

                    {/* Upload Section */}
                    <div className="flex-1 w-full sm:w-auto space-y-4">
                      <input
                        id="avatarUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = event => {
                              setUserSettings(prev => ({
                                ...prev,
                                avatar: event.target?.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      {/* Picture Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setUserSettings(prev => ({
                              ...prev,
                              avatar: undefined,
                            }))
                          }
                          disabled={!userSettings.avatar}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="text-xs sm:text-sm">
                            Remove Picture
                          </span>
                        </Button>
                      </div>

                      {/* Picture Guidelines */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Tip:</strong> Square images work best. Your
                          photo will be cropped to a circle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Profile Update Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                    Update Profile Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={e =>
                          setProfileData(prev => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                    >
                      <Save className="h-4 w-4" />
                      {updateProfileMutation.isPending
                        ? "Updating..."
                        : "Update Profile"}
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Change Username Form */}
                <form onSubmit={handleUsernameChange} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    Change Username
                  </h3>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Current Username
                    </Label>
                    <Input
                      value={user?.username || ""}
                      disabled
                      className="h-10 sm:h-11 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="newUsername"
                        className="text-sm font-medium"
                      >
                        New Username
                      </Label>
                      <Input
                        id="newUsername"
                        type="text"
                        value={usernameData.newUsername}
                        onChange={e =>
                          setUsernameData(prev => ({
                            ...prev,
                            newUsername: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter new username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="usernamePassword"
                        className="text-sm font-medium"
                      >
                        Confirm with Password
                      </Label>
                      <Input
                        id="usernamePassword"
                        type="password"
                        value={usernameData.password}
                        onChange={e =>
                          setUsernameData(prev => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Username Rules:</strong> Must be at least 3
                      characters long and can only contain letters, numbers, and
                      underscores.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={changeUsernameMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                    >
                      <Edit className="h-4 w-4" />
                      {changeUsernameMutation.isPending
                        ? "Changing..."
                        : "Change Username"}
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Change Password Form */}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Change Password
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium"
                      >
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={e =>
                            setPasswordData(prev => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="h-10 sm:h-11 pr-10"
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-medium"
                      >
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e =>
                          setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium"
                      >
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e =>
                          setPasswordData(prev => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      <strong>Security Tip:</strong> Your password must be at
                      least 6 characters long and should include a mix of
                      letters and numbers.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                    >
                      <Lock className="h-4 w-4" />
                      {changePasswordMutation.isPending
                        ? "Changing..."
                        : "Change Password"}
                    </Button>
                  </div>
                </form>

                <Separator />

                {/* Change Email Form */}
                <form
                  onSubmit={handleEmailChange}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                      Change Email Address
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Email Notifications Enabled
                    </div>
                  </div>

                  {/* Current Email Display */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Email Address
                        </Label>
                        <p className="text-base font-mono text-gray-900 dark:text-white mt-1">
                          {user?.email || "Not set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    </div>
                  </div>

                  {/* New Email Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail" className="text-sm font-medium">
                        New Email Address
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={emailData.newEmail}
                        onChange={e =>
                          setEmailData(prev => ({
                            ...prev,
                            newEmail: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter new email address"
                        autoComplete="email"
                      />
                      {emailData.newEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Make sure you can access this email address
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="emailPassword"
                        className="text-sm font-medium"
                      >
                        Confirm with Password
                      </Label>
                      <Input
                        id="emailPassword"
                        type="password"
                        value={emailData.password}
                        onChange={e =>
                          setEmailData(prev => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        className="h-10 sm:h-11"
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  {/* Security Information */}
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            What happens when you change your email?
                          </h4>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>
                              • Email change confirmation sent to both old and
                              new addresses
                            </li>
                            <li>
                              • All future notifications will be sent to the new
                              email
                            </li>
                            <li>
                              • You can continue using your current username and
                              password
                            </li>
                            <li>
                              • Your login credentials remain the same except
                              for the email
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-white">
                            !
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            Important Security Notice
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Make sure the new email address is correct and
                            accessible. Email change notifications will be sent
                            for security purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setEmailData({ newEmail: "", password: "" })
                      }
                      className="flex items-center justify-center gap-2 h-10 sm:h-11"
                    >
                      Clear Form
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        changeEmailMutation.isPending ||
                        !emailData.newEmail ||
                        !emailData.password
                      }
                      className="flex items-center justify-center gap-2 h-10 sm:h-11 min-w-[140px]"
                    >
                      <Mail className="h-4 w-4" />
                      {changeEmailMutation.isPending
                        ? "Changing..."
                        : "Change Email"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-4 sm:space-y-6">
            <Card className="border-0 sm:border shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
                {/* Company Logo Upload */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                    Company Logo
                  </h3>

                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col items-center space-y-4">
                        {/* Current Logo Display with Drag & Drop */}
                        <div className="flex flex-col items-center space-y-3">
                          <div
                            className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                            onDragOver={e => {
                              e.preventDefault();
                              e.currentTarget.classList.add(
                             "border-gray-400",
                             "bg-gray-50",
                             "dark:bg-gray-900/20"
                           );
                            }}
                            onDragLeave={e => {
                              e.preventDefault();
                              e.currentTarget.classList.remove(
                                "border-gray-400",
                                "bg-gray-50",
                                "dark:bg-gray-900/20"
                              );
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              e.currentTarget.classList.remove(
                                "border-gray-400",
                                "bg-gray-50",
                                "dark:bg-gray-900/20"
                              );
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                const reader = new FileReader();
                                reader.onload = event => {
                                  setCompanySettings(prev => ({
                                    ...prev,
                                    logo: event.target?.result as string,
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            onClick={() =>
                              document.getElementById("logoUpload")?.click()
                            }
                          >
                            {companySettings.logo ? (
                              <img
                                src={companySettings.logo}
                                alt="Company Logo"
                                className="w-20 h-20 object-contain rounded"
                              />
                            ) : (
                              <img
                                src="/attached_assets/image_17540348329.svg"
                                alt="Current Logo"
                                className="w-20 h-20 object-contain rounded"
                              />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current Logo
                          </p>
                        </div>

                        {/* Hidden File Input */}
                        <input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = event => {
                                setCompanySettings(prev => ({
                                  ...prev,
                                  logo: event.target?.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />

                        {/* Logo Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCompanySettings(prev => ({
                                ...prev,
                                logo: undefined,
                              }))
                            }
                            disabled={!companySettings.logo}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Logo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Reset to default logo
                              setCompanySettings(prev => ({
                                ...prev,
                                logo: "/attached_assets/image_17540348329.svg",
                              }));
                            }}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset to Default
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 lg:col-span-2">
                    <Label
                      htmlFor="companyName"
                      className="text-sm font-medium"
                    >
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      value={companySettings.companyName}
                      onChange={e =>
                        setCompanySettings(prev => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={companySettings.address}
                      onChange={e =>
                        setCompanySettings(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={e =>
                        setCompanySettings(prev => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="companyEmail"
                      className="text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companySettings.email}
                      onChange={e =>
                        setCompanySettings(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={companySettings.website}
                      onChange={e =>
                        setCompanySettings(prev => ({
                          ...prev,
                          website: e.target.value,
                        }))
                      }
                      className="h-10 sm:h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium">
                      Default Currency
                    </Label>
                    <Select
                      value={companySettings.currency}
                      onValueChange={value =>
                        setCompanySettings(prev => ({
                          ...prev,
                          currency: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="text-sm font-medium">
                      Date Format
                    </Label>
                    <Select
                      value={companySettings.dateFormat}
                      onValueChange={value =>
                        setCompanySettings(prev => ({
                          ...prev,
                          dateFormat: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalYear" className="text-sm font-medium">
                      Fiscal Year Start
                    </Label>
                    <Select
                      value={companySettings.fiscalYearStart}
                      onValueChange={value =>
                        setCompanySettings(prev => ({
                          ...prev,
                          fiscalYearStart: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01/01">January 1st</SelectItem>
                        <SelectItem value="04/01">April 1st</SelectItem>
                        <SelectItem value="07/01">July 1st</SelectItem>
                        <SelectItem value="10/01">October 1st</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    onClick={() => saveCompanyMutation.mutate(companySettings)}
                    disabled={saveCompanyMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                  >
                    <Save className="h-4 w-4" />
                    {saveCompanyMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4 sm:space-y-6">
            <Card className="border-0 sm:border shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Palette className="h-5 w-5" />
                  Appearance & Theme
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium">
                    Theme Selection
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${currentTheme === "light" ? "ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <CardContent className="p-3 sm:p-4 text-center">
                        <Sun className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <p className="font-medium text-sm sm:text-base">
                          Light
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Bright and clean
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${currentTheme === "dark" ? "ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <CardContent className="p-3 sm:p-4 text-center">
                        <Moon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <p className="font-medium text-sm sm:text-base">Dark</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Easy on the eyes
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${currentTheme === "system" ? "ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20" : ""}`}
                      onClick={() => handleThemeChange("system")}
                    >
                      <CardContent className="p-3 sm:p-4 text-center">
                        <Monitor className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
                        <p className="font-medium text-sm sm:text-base">
                          System
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Follow device
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-medium">
                    Language & Region
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-medium">
                        Language
                      </Label>
                      <Select
                        value={userSettings.language}
                        onValueChange={value =>
                          setUserSettings(prev => ({
                            ...prev,
                            language: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-sm font-medium">
                        Region
                      </Label>
                      <Select defaultValue="sa">
                        <SelectTrigger className="h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sa">Saudi Arabia</SelectItem>
                          <SelectItem value="ae">
                            United Arab Emirates
                          </SelectItem>
                          <SelectItem value="kw">Kuwait</SelectItem>
                          <SelectItem value="qa">Qatar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    onClick={() => saveUserMutation.mutate(userSettings)}
                    disabled={saveUserMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                  >
                    <Save className="h-4 w-4" />
                    {saveUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4 sm:space-y-6">
            <Card className="border-0 sm:border shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Database className="h-5 w-5" />
                  Backup & Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="font-medium">Automatic Backup</Label>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Automatically backup data regularly
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={checked =>
                        setSystemSettings(prev => ({
                          ...prev,
                          autoBackup: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="backupFreq"
                        className="text-sm font-medium"
                      >
                        Backup Frequency
                      </Label>
                      <Select
                        value={systemSettings.backupFrequency}
                        onValueChange={value =>
                          setSystemSettings(prev => ({
                            ...prev,
                            backupFrequency: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="retention"
                        className="text-sm font-medium"
                      >
                        Data Retention (Days)
                      </Label>
                      <Input
                        id="retention"
                        type="number"
                        value={systemSettings.dataRetention}
                        onChange={e =>
                          setSystemSettings(prev => ({
                            ...prev,
                            dataRetention: parseInt(e.target.value),
                          }))
                        }
                        className="h-10 sm:h-11"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleBackupNow}
                      variant="outline"
                      className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                    >
                      <Database className="h-4 w-4" />
                      <span className="text-sm">Backup Now</span>
                    </Button>
                    <Button
                      onClick={handleExportData}
                      variant="outline"
                      className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-sm">Export Data</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 sm:border shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="font-medium">
                        Two-Factor Authentication
                      </Label>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Add extra security to your account
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings.twoFactorAuth}
                      onCheckedChange={checked =>
                        setSystemSettings(prev => ({
                          ...prev,
                          twoFactorAuth: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="sessionTimeout"
                      className="text-sm font-medium"
                    >
                      Session Timeout (Minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={e =>
                        setSystemSettings(prev => ({
                          ...prev,
                          sessionTimeout: parseInt(e.target.value),
                        }))
                      }
                      className="h-10 sm:h-11 max-w-xs"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-medium">
                      Password Policy
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="minLength"
                          className="text-sm font-medium"
                        >
                          Minimum Length
                        </Label>
                        <Input
                          id="minLength"
                          type="number"
                          value={systemSettings.passwordPolicy.minLength}
                          onChange={e =>
                            setSystemSettings(prev => ({
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                minLength: parseInt(e.target.value),
                              },
                            }))
                          }
                          className="h-10 sm:h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <Label className="text-sm font-medium">
                          Require Uppercase Letters
                        </Label>
                        <Switch
                          checked={
                            systemSettings.passwordPolicy.requireUppercase
                          }
                          onCheckedChange={checked =>
                            setSystemSettings(prev => ({
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireUppercase: checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <Label className="text-sm font-medium">
                          Require Numbers
                        </Label>
                        <Switch
                          checked={systemSettings.passwordPolicy.requireNumbers}
                          onCheckedChange={checked =>
                            setSystemSettings(prev => ({
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireNumbers: checked,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <Label className="text-sm font-medium">
                          Require Symbols
                        </Label>
                        <Switch
                          checked={systemSettings.passwordPolicy.requireSymbols}
                          onCheckedChange={checked =>
                            setSystemSettings(prev => ({
                              ...prev,
                              passwordPolicy: {
                                ...prev.passwordPolicy,
                                requireSymbols: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    onClick={() => saveSystemMutation.mutate(systemSettings)}
                    disabled={saveSystemMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto h-10 sm:h-11"
                  >
                    <Save className="h-4 w-4" />
                    {saveSystemMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
