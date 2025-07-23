import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FacebookContactService, FacebookContact } from '@/utils/facebookService';
import { Facebook, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Contact } from '@/types/contact';

interface FacebookImportProps {
  onContactsImported: (contacts: Contact[]) => void;
}

export const FacebookImport: React.FC<FacebookImportProps> = ({ onContactsImported }) => {
  const [appId, setAppId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<FacebookContact[]>([]);
  const [facebookService, setFacebookService] = useState<FacebookContactService | null>(null);

  const handleConnect = async () => {
    if (!appId.trim()) {
      setError('Please enter your Facebook App ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const service = new FacebookContactService(appId);
      await service.authenticate();
      
      setFacebookService(service);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportContacts = async () => {
    if (!facebookService) return;

    setIsLoading(true);
    setError(null);

    try {
      const fbContacts = await facebookService.getContacts();
      setContacts(fbContacts);

      // Convert Facebook contacts to our Contact format
      const convertedContacts: Contact[] = fbContacts.map((fbContact, index) => ({
        id: `fb_${fbContact.id}`,
        name: fbContact.name,
        email: fbContact.email || '',
        phone: fbContact.phone || '',
        company: 'Unknown Company',
        jobTitle: 'Unknown Title',
        industry: 'Unknown Industry',
        howWeMet: 'Facebook Import',
        tags: ['Facebook'],
        notes: `Imported from Facebook on ${new Date().toLocaleDateString()}`,
        createdAt: new Date(),
      }));

      onContactsImported(convertedContacts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (facebookService) {
      await facebookService.logout();
    }
    setFacebookService(null);
    setIsConnected(false);
    setContacts([]);
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Facebook Contact Import
        </CardTitle>
        <CardDescription>
          Import your Facebook friends to BeeTagged
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="facebook-app-id">Facebook App ID</Label>
              <Input
                id="facebook-app-id"
                type="text"
                placeholder="Enter your Facebook App ID"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                You need to create a Facebook app to use this feature. 
                <a 
                  href="https://developers.facebook.com/apps/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-1"
                >
                  Create one here
                </a>
              </p>
            </div>

            <Button 
              onClick={handleConnect} 
              disabled={isLoading || !appId.trim()}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect to Facebook'}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to Facebook!
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleImportContacts}
                disabled={isLoading}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Importing...' : 'Import Contacts'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                Disconnect
              </Button>
            </div>

            {contacts.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {contacts.length} contacts!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Note:</strong> Facebook's API has restrictions on friend data access.</p>
          <p>You may only see friends who have also authorized your app.</p>
          <p>For full contact import, consider using LinkedIn instead.</p>
        </div>
      </CardContent>
    </Card>
  );
};