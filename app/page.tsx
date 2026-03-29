import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Users,
  Package,
  FileText,
  Calculator,
  TrendingUp,
  Receipt,
  FolderOpen,
  UserPlus,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Layers,
  ArrowRight,
  Star,
} from "lucide-react"
import Image from "next/image"

export default function Page() {
  const mainFeatures = [
    {
      icon: LayoutDashboard,
      title: "Smart Dashboard",
      description:
        "Get a comprehensive overview of all your projects, recent activities, and key metrics at a glance. Monitor project health, track deadlines, and stay informed with real-time updates.",
    },
    {
      icon: FolderKanban,
      title: "Project Management",
      description:
        "Manage multiple interior design projects efficiently. Track progress from concept to completion with detailed project timelines, milestones, and team assignments.",
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description:
        "Leverage AI-powered insights for cost estimation, material recommendations, and project optimization. Get intelligent suggestions based on your project requirements.",
    },
    {
      icon: Users,
      title: "User Management",
      description:
        "Control team access and permissions. Assign roles to team members and manage client access to ensure secure collaboration on every project.",
    },
    {
      icon: Package,
      title: "Product Catalog",
      description:
        "Maintain a comprehensive database of materials, furniture, and finishes. Track prices, manage suppliers, and quickly add items to your BOQ.",
    },
    {
      icon: FileText,
      title: "BOQ Templates",
      description:
        "Create and reuse Bill of Quantities templates for faster project setup. Standardize your estimates and maintain consistency across all projects.",
    },
  ]

  const projectFeatures = [
    {
      icon: Layers,
      title: "Layout Management",
      description:
        "Upload and manage CAD files, 3D renders, and project photos. Keep all visual assets organized and accessible.",
    },
    {
      icon: Calculator,
      title: "BOQ Builder",
      description:
        "Create detailed Bills of Quantities with preliminary works, fitting out, and furniture items. Auto-calculate totals and manage pricing.",
    },
    {
      icon: TrendingUp,
      title: "Gantt Chart",
      description:
        "Visualize project timelines with interactive Gantt charts. Set start and end dates for each task and track progress in real-time.",
    },
    {
      icon: Receipt,
      title: "Invoice & Termin",
      description:
        "Generate professional invoices and manage payment terms. Track payments and maintain clear financial records for each project.",
    },
    {
      icon: FolderOpen,
      title: "Document Storage",
      description:
        "Centralize all project documents including contracts, specifications, and correspondence in one secure location.",
    },
    {
      icon: UserPlus,
      title: "Team Collaboration",
      description:
        "Add team members and clients to projects. Assign roles and control access levels for seamless collaboration.",
    },
  ]

  const benefits = [
    {
      icon: Clock,
      title: "Save Time",
      stat: "60%",
      description: "Reduce estimation time with templates and automated calculations",
    },
    {
      icon: DollarSign,
      title: "Cost Accuracy",
      stat: "95%",
      description: "Achieve precise cost estimates with real-time product pricing",
    },
    {
      icon: CheckCircle,
      title: "Project Success",
      stat: "100%",
      description: "Complete projects on time with comprehensive tracking tools",
    },
    {
      icon: BarChart3,
      title: "Better Insights",
      stat: "3x",
      description: "Gain deeper project insights with AI-powered analytics",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Interior Design Background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/modern-office-interior-design-workspace-with-clean.jpg"
            alt="Modern office interior"
            fill
            className="object-cover opacity-10"
            priority
          />
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/10" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <header className="relative container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        </header>

        <main className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="w-4 h-4" />
                Interior Design Project Management Platform
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                Streamline Your
                <span className="block text-primary mt-2">Office Interior Projects</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                The complete platform for interior designers to manage projects, create accurate cost estimates, track
                progress with Gantt charts, and collaborate seamlessly with clients and teams.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Button size="lg" className="w-full sm:w-auto gap-2" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" asChild>
                  <Link href="/login">Sign In to Dashboard</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5 rounded-3xl" />
                <Image
                  src="/professional-interior-designer-working-on-office-l.jpg"
                  alt="Interior design planning"
                  fill
                  className="object-cover p-8 rounded-3xl"
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">{benefit.stat}</div>
                  <div className="font-semibold">{benefit.title}</div>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Manage Interior Projects</h2>
            <p className="text-lg text-muted-foreground">
              From initial estimates to project completion, IDBuild provides all the tools you need to deliver
              exceptional interior design projects on time and within budget.
            </p>
          </div>

          <div className="mb-16 relative rounded-2xl overflow-hidden border shadow-xl">
            <Image
              src="/images/screenshot-202025-12-19-20at-2022.png"
              alt="IDBuild Dashboard"
              width={1200}
              height={600}
              className="w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-lg font-medium">Powerful dashboard to manage all your interior design projects</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group p-6 md:p-8 rounded-2xl border bg-card hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Project Detail Features */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Project Management</h2>
            <p className="text-lg text-muted-foreground">
              Each project comes with powerful tools to manage every aspect of your interior design work, from layouts
              and materials to invoicing and team collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-xl bg-card border hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold">Solving Real Challenges for Interior Designers</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Accurate Cost Estimation</h3>
                    <p className="text-muted-foreground">
                      No more spreadsheet errors. Create detailed BOQs with automatic calculations and real-time product
                      pricing from your catalog.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Streamlined Client Approval</h3>
                    <p className="text-muted-foreground">
                      Share BOQs with clients and get approvals directly in the platform. Track revisions and maintain
                      clear communication throughout.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Visual Progress Tracking</h3>
                    <p className="text-muted-foreground">
                      Keep everyone informed with photo albums organized by project phases. Document before, during, and
                      after transformations.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Centralized Project Data</h3>
                    <p className="text-muted-foreground">
                      All project information, documents, and communications in one place. No more searching through
                      emails and scattered files.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-3/4 rounded-2xl overflow-hidden border shadow-lg">
                    <Image
                      src="/modern-office-interior-with-ergonomic-furniture-an.jpg"
                      alt="Modern office interior"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden border shadow-lg">
                    <Image
                      src="/office-meeting-room-interior-design-with-glass-wal.jpg"
                      alt="Meeting room design"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative aspect-square rounded-2xl overflow-hidden border shadow-lg">
                    <Image
                      src="/executive-office-interior-with-wooden-desk-and-lea.jpg"
                      alt="Executive office"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-3/4 rounded-2xl overflow-hidden border shadow-lg">
                    <Image
                      src="/open-plan-office-workspace-with-collaborative-area.jpg"
                      alt="Open plan office"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Decorative gradient overlay */}
              <div className="absolute -inset-4 bg-linear-to-br from-primary/10 to-transparent rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Interior Design Business?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Join interior designers who are already using IDBuild to deliver projects faster, more accurately, and with
            better client satisfaction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} IDBuild. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
