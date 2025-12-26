import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getApiUrl } from '../../../config/config';

type SettingsTab = 'profile' | 'security';

export const TeamSettingsSection = () => {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFAMessage, setTwoFAMessage] = useState({ type: '', text: '' });
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(getApiUrl('api/auth/me'), {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.user) {
          setName(data.user.name || '');
          setNickname(data.user.nickname || '');
          setProfilePicture(data.user.profile_picture || null);
          setTwoFAEnabled(data.user.totp_enabled || false);
        }
      } catch {
        // Ignore
      }
    };
    fetchUserData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileMessage({ type: 'error', text: t('teamDashboard.onlyImagesAllowed') });
        return;
      }

      // Validate file size (max 20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        setProfileMessage({ type: 'error', text: t('teamDashboard.fileTooLarge') });
        return;
      }

      // Store the file for upload
      setSelectedFile(file);
      setProfileMessage({ type: '', text: '' });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    setUploadProgress(0);

    // Use multipart/form-data upload if there's a file
    if (selectedFile) {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('nickname', nickname);
      formData.append('profile_picture', selectedFile);

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.addEventListener('load', async () => {
          setProfileLoading(false);
          setUploadProgress(0);

          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.success) {
                setProfileMessage({ type: 'success', text: t('teamDashboard.profileUpdated') });
                setSelectedFile(null);
                await refreshUser();
                resolve();
              } else {
                setProfileMessage({ type: 'error', text: data.error || t('teamDashboard.failedToUpdateProfile') });
                reject(new Error(data.error));
              }
            } catch (error) {
              setProfileMessage({ type: 'error', text: t('teamDashboard.networkError') });
              reject(error);
            }
          } else {
            setProfileMessage({ type: 'error', text: t('teamDashboard.networkError') });
            reject(new Error(`HTTP ${xhr.status}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          setProfileLoading(false);
          setUploadProgress(0);
          setProfileMessage({ type: 'error', text: t('teamDashboard.networkError') });
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          setProfileLoading(false);
          setUploadProgress(0);
          setProfileMessage({ type: 'error', text: t('teamDashboard.uploadCancelled') });
          reject(new Error('Upload cancelled'));
        });

        // Send request
        xhr.open('POST', getApiUrl('api/auth/profile/upload'));
        // xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    } else {
      // No file selected, use regular JSON update
      try {
        const response = await fetch(getApiUrl('api/auth/profile'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ name, nickname }),
        });

        const data = await response.json();
        if (data.success) {
          setProfileMessage({ type: 'success', text: t('teamDashboard.profileUpdated') });
          await refreshUser();
        } else {
          setProfileMessage({ type: 'error', text: data.error || t('teamDashboard.failedToUpdateProfile') });
        }
      } catch {
        setProfileMessage({ type: 'error', text: t('teamDashboard.networkError') });
      } finally {
        setProfileLoading(false);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('teamDashboard.passwordsDoNotMatch') });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('api/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: t('teamDashboard.passwordChanged') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || t('error.failedToChangePassword') });
      }
    } catch {
      setMessage({ type: 'error', text: t('teamDashboard.networkError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    setTwoFAMessage({ type: '', text: '' });
    try {
      const response = await fetch(getApiUrl('api/auth/2fa/setup'), {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success && data.qr_code) {
        setQRCodeData(data.qr_code);
        setShowQRCode(true);
        setTwoFAMessage({ type: 'success', text: t('twoFactor.scanQRCode') });
      } else {
        setTwoFAMessage({ type: 'error', text: data.error || t('error.failedToSetup2FA') });
      }
    } catch {
      setTwoFAMessage({ type: 'error', text: t('teamDashboard.networkError') });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setTwoFAMessage({ type: 'error', text: t('error.enter6DigitCode') });
      return;
    }

    setTwoFALoading(true);
    setTwoFAMessage({ type: '', text: '' });
    try {
      const response = await fetch(getApiUrl('api/auth/2fa/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();
      if (data.success) {
        setTwoFAMessage({ type: 'success', text: data.message || t('success.twoFAEnabled') });
        setTwoFAEnabled(true);
        setShowQRCode(false);
        setVerificationCode('');
        setQRCodeData('');
      } else {
        setTwoFAMessage({ type: 'error', text: data.error || t('error.invalidVerificationCode') });
      }
    } catch {
      setTwoFAMessage({ type: 'error', text: t('teamDashboard.networkError') });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAMessage({ type: '', text: '' });
    try {
      const response = await fetch(getApiUrl('api/auth/2fa/disable'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: disablePassword }),
      });

      const data = await response.json();
      if (data.success) {
        setTwoFAMessage({ type: 'success', text: data.message || t('success.twoFADisabled') });
        setTwoFAEnabled(false);
        setDisablePassword('');
      } else {
        setTwoFAMessage({ type: 'error', text: data.error || t('error.failedToDisable2FA') });
      }
    } catch {
      setTwoFAMessage({ type: 'error', text: t('teamDashboard.networkError') });
    } finally {
      setTwoFALoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">{t('teamDashboard.settings')}</h2>

      { }
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 rounded-lg overflow-hidden max-w-4xl mx-auto">
        <div className="flex border-b border-zinc-900">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'profile'
              ? 'bg-zinc-900 text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
              }`}
          >
            {t('teamDashboard.profileTab')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'security'
              ? 'bg-zinc-900 text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
              }`}
          >
            {t('teamDashboard.securityTab')}
          </button>
        </div>

        <div className="p-8">
          { }
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('teamDashboard.editProfile')}</h3>
                <p className="text-sm text-gray-400">{t('teamDashboard.editProfileDesc')}</p>
              </div>

              {profileMessage.text && (
                <div className={`p-4 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{profileMessage.text}</p>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.profileName')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.profileNickname')}</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                      minLength={3}
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">{t('teamDashboard.profilePicture')}</label>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">{t('teamDashboard.noImage')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-gray-300 focus:outline-none focus:border-zinc-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                      />
                      <p className="text-xs text-gray-400">{t('teamDashboard.maxFileSize')}</p>
                      {uploadProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">{t('teamDashboard.uploading')}</span>
                            <span className="text-white font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-green-500 h-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                  >
                    {profileLoading ? t('teamDashboard.updatingProfile') : t('teamDashboard.updateProfile')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab Content */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              { }
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{t('teamDashboard.changePassword')}</h3>
                <p className="text-sm text-gray-400">{t('teamDashboard.changePasswordDesc')}</p>
              </div>

              {message.text && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{message.text}</p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.currentPassword')}</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('teamDashboard.confirmNewPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? t('teamDashboard.changingPassword') : t('teamDashboard.changePassword')}
                  </button>
                </div>
              </form>

              { }
              <div className="pt-8 border-t border-zinc-800">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{t('twoFactor.title')}</h3>
                  <p className="text-sm text-gray-400">{t('twoFactor.description')}</p>
                </div>

                {twoFAMessage.text && (
                  <div className={`p-4 rounded-lg mb-6 ${twoFAMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className={`text-sm ${twoFAMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{twoFAMessage.text}</p>
                  </div>
                )}

                {!twoFAEnabled && !showQRCode && (
                  <div>
                    <p className="text-gray-400 mb-4">{t('twoFactor.disabledMessage')}</p>
                    <button
                      onClick={handleSetup2FA}
                      disabled={twoFALoading}
                      className="px-6 py-3 bg-accent-green text-white rounded-lg hover:bg-accent-green-dark transition-colors font-medium disabled:opacity-50"
                    >
                      {twoFALoading ? t('twoFactor.settingUp') : t('twoFactor.enableButton')}
                    </button>
                  </div>
                )}

                {showQRCode && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900 p-6 rounded-lg">
                      <p className="text-white mb-4">{t('twoFactor.step1')}</p>
                      <div className="flex justify-center bg-white p-4 rounded-lg">
                        <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
                      </div>
                    </div>

                    <form onSubmit={handleVerify2FA} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('twoFactor.step2')}</label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          placeholder={t('twoFactor.codePlaceholder')}
                          required
                          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={twoFALoading || verificationCode.length !== 6}
                        className="w-full px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                      >
                        {twoFALoading ? t('twoFactor.verifying') : t('twoFactor.verifyButton')}
                      </button>
                    </form>
                  </div>
                )}

                {twoFAEnabled && !showQRCode && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-400 font-medium">{t('twoFactor.enabledMessage')}</p>
                    </div>

                    <form onSubmit={handleDisable2FA} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('twoFactor.enterPasswordToDisable')}</label>
                        <input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-zinc-700"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={twoFALoading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {twoFALoading ? t('twoFactor.disabling') : t('twoFactor.disableButton')}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
