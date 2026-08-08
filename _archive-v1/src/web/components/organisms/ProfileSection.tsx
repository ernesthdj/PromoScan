/**
 * ProfileSection — Section du profil utilisateur (avatar, info, zone, preferences).
 */

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Divider } from '../atoms/Divider';
import { LogOut, MapPin, Settings } from 'lucide-react';

interface ProfileSectionProps {
  email: string;
  zoneCodePostal: string | null;
  zoneCommune: string | null;
  onEditZone: () => void;
  onEditPreferences: () => void;
  onLogout: () => void;
}

export function ProfileSection({
  email,
  zoneCodePostal,
  zoneCommune,
  onEditZone,
  onEditPreferences,
  onLogout,
}: ProfileSectionProps) {
  const displayName = email.split('@')[0];

  return (
    <section className="flex flex-col gap-6">
      {/* En-tete profil */}
      <div className="flex items-center gap-4">
        <Avatar name={displayName} size="lg" />
        <div>
          <p className="text-lg font-semibold text-neutral-800">{displayName}</p>
          <p className="text-sm text-neutral-500">{email}</p>
        </div>
      </div>

      <Divider />

      {/* Zone geographique */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-neutral-400" />
          <div>
            <p className="text-sm font-medium text-neutral-700">Zone geographique</p>
            <p className="text-xs text-neutral-500">
              {zoneCodePostal && zoneCommune
                ? `${zoneCodePostal} — ${zoneCommune}`
                : 'Non definie'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEditZone}>
          Modifier
        </Button>
      </div>

      {/* Preferences */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">Preferences de scoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={onEditPreferences}>
          Configurer
        </Button>
      </div>

      <Divider />

      {/* Deconnexion */}
      <Button
        variant="outline"
        onClick={onLogout}
        icon={<LogOut size={16} />}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        Se deconnecter
      </Button>
    </section>
  );
}
