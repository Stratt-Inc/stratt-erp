import {
  Users,
  Shield,
  Calendar,
  BookOpen,
  ClipboardList,
  Plus,
  Settings,
  ChevronRight,
  Lock,
  Server,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsGrid } from "@/components/StatsGrid";

const users = [
  { nom: "Martin Dupont", email: "m.dupont@metropole-lyon.fr", role: "Administrateur", service: "Direction Achats", derniereConnexion: "04/03/2026" },
  { nom: "Sophie Martin", email: "s.martin@metropole-lyon.fr", role: "Direction", service: "DGA Finances", derniereConnexion: "03/03/2026" },
  { nom: "Pierre Lefebvre", email: "p.lefebvre@metropole-lyon.fr", role: "Service achats", service: "DGA Infrastructures", derniereConnexion: "04/03/2026" },
  { nom: "Claire Moreau", email: "c.moreau@metropole-lyon.fr", role: "Service achats", service: "DGA Éducation", derniereConnexion: "02/03/2026" },
  { nom: "Jean Rousseau", email: "j.rousseau@metropole-lyon.fr", role: "Lecture seule", service: "DGA Environnement", derniereConnexion: "28/02/2026" },
  { nom: "Marie Bernard", email: "m.bernard@metropole-lyon.fr", role: "Service achats", service: "DGA Numérique", derniereConnexion: "04/03/2026" },
];

const roleStyles: Record<string, string> = {
  "Administrateur": "bg-primary/8 text-primary border-primary/15",
  "Direction": "bg-accent/8 text-accent border-accent/15",
  "Service achats": "bg-info/8 text-info border-info/15",
  "Lecture seule": "bg-muted text-muted-foreground border-border",
};

const journal = [
  { action: "Connexion", utilisateur: "M. Dupont", date: "04/03/2026 09:12", detail: "Accès tableau de bord stratégique" },
  { action: "Modification", utilisateur: "S. Martin", date: "03/03/2026 16:45", detail: "Mise à jour nomenclature v3.2" },
  { action: "Export", utilisateur: "P. Lefebvre", date: "03/03/2026 14:20", detail: "Génération document d'implémentation PDF" },
  { action: "Création", utilisateur: "M. Dupont", date: "03/03/2026 11:05", detail: "Nouveau marché M2026-055 — Mobilier scolaire" },
  { action: "Validation", utilisateur: "M. Bernard", date: "02/03/2026 15:30", detail: "Validation nomenclature PI/TIC par DGA Numérique" },
  { action: "Connexion", utilisateur: "C. Moreau", date: "02/03/2026 08:30", detail: "Accès module planification" },
];

export default function Administration() {
  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="animate-fade-in">
        <p className="section-label mb-2">Administration</p>
        <h1 className="mb-2">Gestion de la plateforme</h1>
        <p className="text-[14px] text-muted-foreground">Utilisateurs, rôles, paramètres et sécurité</p>
      </div>

      {/* Stats Admin */}
      <StatsGrid
        stats={[
          { label: "Utilisateurs actifs", value: "6", icon: Users },
          { label: "Connexions aujourd'hui", value: "12", icon: Activity, trend: { value: "+3", positive: true } },
          { label: "Sécurité système", value: "100%", icon: Shield },
          { label: "Dernière sauvegarde", value: "30min", icon: Server },
        ]}
        columns="4"
      />

      <Tabs defaultValue="utilisateurs" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="utilisateurs" className="gap-2 text-[13px] h-8 px-4"><Users className="w-4 h-4" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="parametres" className="gap-2 text-[13px] h-8 px-4"><Settings className="w-4 h-4" />Paramètres</TabsTrigger>
          <TabsTrigger value="journal" className="gap-2 text-[13px] h-8 px-4"><ClipboardList className="w-4 h-4" />Journal</TabsTrigger>
          <TabsTrigger value="support" className="gap-2 text-[13px] h-8 px-4"><BookOpen className="w-4 h-4" />Support</TabsTrigger>
        </TabsList>

        <TabsContent value="utilisateurs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">{users.length} utilisateurs actifs — Accès illimité</p>
            <Button size="sm" className="gap-2 text-[12px]"><Plus className="w-3.5 h-3.5" /> Ajouter</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Service / Direction</th><th>Dernière connexion</th><th></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td className="font-medium text-[12px]">{u.nom}</td>
                      <td className="text-muted-foreground text-[11px]">{u.email}</td>
                      <td><span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${roleStyles[u.role]}`}>{u.role}</span></td>
                      <td className="text-[11px] text-muted-foreground">{u.service}</td>
                      <td className="text-[11px] text-muted-foreground tabular-nums">{u.derniereConnexion}</td>
                      <td><ChevronRight className="w-3 h-3 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-[13px] flex items-center gap-2"><Settings className="w-4 h-4" /> Organisation</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-[12px]">
                {[
                  ["Collectivité", "Métropole de Lyon"],
                  ["SIRET", "200 046 977 00012"],
                  ["Type", "Métropole"],
                  ["Population", "1 400 000 hab."],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-[13px] flex items-center gap-2"><Calendar className="w-4 h-4" /> Exercices budgétaires</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  { year: "2026", status: "Actif", active: true },
                  { year: "2025", status: "Archivé", active: false },
                  { year: "2024", status: "Archivé", active: false },
                ].map((y) => (
                  <div key={y.year} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="font-semibold text-[12px]">{y.year}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                      y.active ? "bg-accent/8 text-accent border-accent/15" : "bg-muted text-muted-foreground border-border"
                    }`}>{y.status}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-[13px] flex items-center gap-2"><Shield className="w-4 h-4" /> Sécurité & Conformité</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { label: "Hébergement", value: "France — SecNumCloud", icon: Server },
                    { label: "RGPD", value: "Conforme", icon: Shield },
                    { label: "Chiffrement", value: "AES-256 / TLS 1.3", icon: Lock },
                    { label: "Authentification", value: "SSO / 2FA", icon: Users },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded border bg-card text-center">
                      <s.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <p className="text-[12px] font-semibold mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal" className="mt-3">
          <Card>
            <CardContent className="p-0">
              <table className="data-table">
                <thead><tr><th>Action</th><th>Utilisateur</th><th>Date & Heure</th><th>Détail</th></tr></thead>
                <tbody>
                  {journal.map((j, i) => (
                    <tr key={i}>
                      <td><span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted uppercase tracking-wider">{j.action}</span></td>
                      <td className="font-medium text-[12px]">{j.utilisateur}</td>
                      <td className="text-[11px] text-muted-foreground font-mono">{j.date}</td>
                      <td className="text-[12px] text-muted-foreground">{j.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-3 mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-[13px] flex items-center gap-2"><BookOpen className="w-4 h-4" /> Formation incluse</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-[12px] text-muted-foreground">2 heures de formation incluses dans votre abonnement.</p>
                {[
                  { label: "Prise en main de la plateforme", duree: "45 min" },
                  { label: "Élaboration de nomenclature", duree: "30 min" },
                  { label: "Cartographie et analyse avancée", duree: "45 min" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between p-2 rounded bg-muted/30 text-[12px]">
                    <span>{f.label}</span>
                    <span className="text-muted-foreground">{f.duree}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-[11px] h-7">Planifier une session</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-[13px]">Assistance technique</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-[12px]">
                <div className="p-2.5 rounded bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Support prioritaire</p>
                  <p className="font-medium mt-0.5">Lundi — Vendredi, 9h — 18h</p>
                </div>
                <div className="p-2.5 rounded bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact</p>
                  <p className="font-medium mt-0.5">support@cartoap.fr</p>
                </div>
                <div className="p-2.5 rounded bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Documentation</p>
                  <p className="font-medium mt-0.5">docs.cartoap.fr</p>
                </div>
                <Button variant="outline" size="sm" className="w-full text-[11px] h-7">Ouvrir un ticket</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
