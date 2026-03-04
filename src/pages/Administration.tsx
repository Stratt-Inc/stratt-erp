import {
  Users,
  Shield,
  Calendar,
  BookOpen,
  ClipboardList,
  Plus,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const users = [
  { nom: "Martin Dupont", email: "m.dupont@metropole-lyon.fr", role: "Administrateur", service: "Direction Achats", derniereConnexion: "04/03/2026" },
  { nom: "Sophie Martin", email: "s.martin@metropole-lyon.fr", role: "Direction", service: "DGA Finances", derniereConnexion: "03/03/2026" },
  { nom: "Pierre Lefebvre", email: "p.lefebvre@metropole-lyon.fr", role: "Service achats", service: "DGA Infrastructures", derniereConnexion: "04/03/2026" },
  { nom: "Claire Moreau", email: "c.moreau@metropole-lyon.fr", role: "Service achats", service: "DGA Éducation", derniereConnexion: "02/03/2026" },
  { nom: "Jean Rousseau", email: "j.rousseau@metropole-lyon.fr", role: "Lecture seule", service: "DGA Environnement", derniereConnexion: "28/02/2026" },
  { nom: "Marie Bernard", email: "m.bernard@metropole-lyon.fr", role: "Service achats", service: "DGA Numérique", derniereConnexion: "04/03/2026" },
];

const roleColor: Record<string, string> = {
  "Administrateur": "bg-primary/10 text-primary border-primary/20",
  "Direction": "bg-accent/10 text-accent border-accent/20",
  "Service achats": "bg-info/10 text-info border-info/20",
  "Lecture seule": "bg-muted text-muted-foreground border-border",
};

const journal = [
  { action: "Connexion", utilisateur: "M. Dupont", date: "04/03/2026 09:12", detail: "Accès tableau de bord" },
  { action: "Modification", utilisateur: "S. Martin", date: "03/03/2026 16:45", detail: "Mise à jour nomenclature v3.2" },
  { action: "Export", utilisateur: "P. Lefebvre", date: "03/03/2026 14:20", detail: "Export PDF cartographie" },
  { action: "Création", utilisateur: "M. Dupont", date: "03/03/2026 11:05", detail: "Nouveau marché M2026-055" },
  { action: "Connexion", utilisateur: "C. Moreau", date: "02/03/2026 08:30", detail: "Accès planification" },
];

export default function Administration() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des utilisateurs, rôles et paramètres</p>
        </div>
      </div>

      <Tabs defaultValue="utilisateurs">
        <TabsList>
          <TabsTrigger value="utilisateurs" className="gap-2 text-xs"><Users className="w-3.5 h-3.5" />Utilisateurs</TabsTrigger>
          <TabsTrigger value="parametres" className="gap-2 text-xs"><Settings className="w-3.5 h-3.5" />Paramètres</TabsTrigger>
          <TabsTrigger value="journal" className="gap-2 text-xs"><ClipboardList className="w-3.5 h-3.5" />Journal</TabsTrigger>
          <TabsTrigger value="support" className="gap-2 text-xs"><BookOpen className="w-3.5 h-3.5" />Support</TabsTrigger>
        </TabsList>

        <TabsContent value="utilisateurs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{users.length} utilisateurs — Accès illimité</p>
            <Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" /> Ajouter un utilisateur</Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Service</th>
                    <th>Dernière connexion</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.email}>
                      <td className="font-medium">{u.nom}</td>
                      <td className="text-muted-foreground text-xs">{u.email}</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${roleColor[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{u.service}</td>
                      <td className="text-xs text-muted-foreground">{u.derniereConnexion}</td>
                      <td><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Collectivité</span>
                  <span className="font-medium">Métropole de Lyon</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">SIRET</span>
                  <span className="font-mono text-xs">200 046 977 00012</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">Type</span>
                  <span>Métropole</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Années budgétaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {["2026", "2025", "2024"].map((year) => (
                  <div key={year} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="font-medium text-sm">{year}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${
                      year === "2026" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {year === "2026" ? "Actif" : "Archivé"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Sécurité & Conformité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded border bg-card text-center">
                    <p className="text-xs text-muted-foreground">Hébergement</p>
                    <p className="text-sm font-medium mt-1">France — SecNumCloud</p>
                  </div>
                  <div className="p-3 rounded border bg-card text-center">
                    <p className="text-xs text-muted-foreground">RGPD</p>
                    <p className="text-sm font-medium mt-1 text-accent">Conforme</p>
                  </div>
                  <div className="p-3 rounded border bg-card text-center">
                    <p className="text-xs text-muted-foreground">Chiffrement</p>
                    <p className="text-sm font-medium mt-1">AES-256 / TLS 1.3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-4 mt-4">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th>Date & Heure</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.map((j, i) => (
                    <tr key={i}>
                      <td>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{j.action}</span>
                      </td>
                      <td className="font-medium text-sm">{j.utilisateur}</td>
                      <td className="text-xs text-muted-foreground font-mono">{j.date}</td>
                      <td className="text-sm text-muted-foreground">{j.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Formation incluse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">2 heures de formation incluses dans votre abonnement.</p>
                <div className="space-y-2">
                  {[
                    { label: "Prise en main de la plateforme", duree: "45 min" },
                    { label: "Création de nomenclature", duree: "30 min" },
                    { label: "Cartographie avancée", duree: "45 min" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm">{f.label}</span>
                      <span className="text-xs text-muted-foreground">{f.duree}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs">Planifier une session</Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Assistance technique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 rounded bg-muted/30">
                  <p className="text-muted-foreground text-xs">Support prioritaire</p>
                  <p className="font-medium mt-1">Lundi — Vendredi, 9h — 18h</p>
                </div>
                <div className="p-3 rounded bg-muted/30">
                  <p className="text-muted-foreground text-xs">Contact</p>
                  <p className="font-medium mt-1">support@cartoap.fr</p>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs">Ouvrir un ticket</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
