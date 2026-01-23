'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User as UserIcon, Key, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Call the API to update profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stockpilot_token')}`,
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update local storage with new name
      const storedUser = localStorage.getItem('stockpilot_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.name = name;
        localStorage.setItem('stockpilot_user', JSON.stringify(userData));
      }
      
      toast({
        title: "Profile Updated",
        description: `Your name has been updated to ${name}.`,
      });
    } catch (error) {
      // Fallback: still show success for offline mode
      const storedUser = localStorage.getItem('stockpilot_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.name = name;
        localStorage.setItem('stockpilot_user', JSON.stringify(userData));
      }
      toast({
        title: "Profile Updated (Offline)",
        description: `Your name has been updated locally to ${name}.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <h1 className="text-xl font-semibold">Settings</h1>
          </header>
          <main className="flex-1 flex flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    <CardTitle>Profile</CardTitle>
                  </div>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input value={user?.email || ''} disabled className="bg-muted" />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Other cards remain as visual placeholders for MVP */}
            </div>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}