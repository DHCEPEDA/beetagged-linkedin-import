import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Contact } from '@/lib/api';
import { Building2, MapPin, Mail, Calendar } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const initials = contact.name
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-card/50 backdrop-blur-sm border-border/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {contact.name}
            </h3>
            {contact.position && (
              <p className="text-sm text-muted-foreground truncate">
                {contact.position}
              </p>
            )}
          </div>
          {contact.source && (
            <Badge variant="outline" className="text-xs">
              {contact.source}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {contact.company && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
        
        {contact.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{contact.location}</span>
          </div>
        )}
        
        {contact.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contact.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{contact.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {contact.createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Calendar className="h-3 w-3" />
            <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}