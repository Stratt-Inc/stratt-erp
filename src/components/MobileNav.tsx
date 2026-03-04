import { LayoutDashboard, CalendarRange, Map, FolderTree, FileText, Settings, HelpCircle, ChevronUp, Moon, Sun } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "next-themes";

const primaryTabs = [
	{ title: "Bord", url: "/", icon: LayoutDashboard },
	{ title: "Planif.", url: "/planification", icon: CalendarRange },
	{ title: "Carto.", url: "/cartographie", icon: Map },
	{ title: "Nomencl.", url: "/nomenclature", icon: FolderTree },
	{ title: "Docs", url: "/exports", icon: FileText },
];

const moreTabs = [
	{ title: "Administration", url: "/administration", icon: Settings },
	{ title: "Support & Formation", url: "/support", icon: HelpCircle },
];

export function MobileNav() {
	const [expanded, setExpanded] = useState(false);
	const location = useLocation();
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark";

	const isActive = (path: string) =>
		path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

	const moreIsActive = moreTabs.some((t) => isActive(t.url));

	return (
		<>
			{/* Backdrop — only when expanded */}
			{expanded && (
				<div className="md:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setExpanded(false)} />
			)}

			<div
				className="md:hidden fixed bottom-0 left-0 right-0 z-50"
				style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
			>
				{/* Expanded tray — slides up, attached to the bar */}
				{expanded && (
					<div className="border-t border-x rounded-t-xl bg-card shadow-lg mx-0">
						{moreTabs.map((tab) => (
							<NavLink
								key={tab.url}
								to={tab.url}
								onClick={() => setExpanded(false)}
								className={`flex items-center gap-3 px-5 py-3 transition-colors ${
									isActive(tab.url)
										? "text-primary font-semibold"
										: "text-foreground"
								}`}
							>
								<tab.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive(tab.url) ? 2.5 : 2} />
								<span className="text-[13px]">{tab.title}</span>
							</NavLink>
						))}
						{/* Theme toggle row */}
						<button
							onClick={() => setTheme(isDark ? "light" : "dark")}
							className="flex items-center gap-3 px-5 py-3 w-full transition-colors text-foreground border-t border-border/50"
						>
							{isDark ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
							<span className="text-[13px]">{isDark ? "Mode clair" : "Mode sombre"}</span>
						</button>
					</div>
				)}

				{/* Main tab bar */}
				<nav className="border-t bg-card/95 backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
					<div className="flex items-stretch">
						{primaryTabs.map((tab) => (
							<NavLink
								key={tab.url}
								to={tab.url}
								end={tab.url === "/"}
								onClick={() => setExpanded(false)}
								className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
									isActive(tab.url) ? "text-primary" : "text-muted-foreground"
								}`}
							>
								<tab.icon className="w-[18px] h-[18px]" strokeWidth={isActive(tab.url) ? 2.5 : 2} />
								<span className="text-[9px] font-medium leading-none truncate w-full text-center">{tab.title}</span>
							</NavLink>
						))}

						{/* "Plus" tab */}
						<button
							onClick={() => setExpanded((v) => !v)}
							className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors ${
								moreIsActive || expanded ? "text-primary" : "text-muted-foreground"
							}`}
						>
							<ChevronUp className={`w-[18px] h-[18px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} strokeWidth={moreIsActive ? 2.5 : 2} />
							<span className="text-[9px] font-medium leading-none">Plus</span>
						</button>
					</div>
				</nav>
			</div>
		</>
	);
}
