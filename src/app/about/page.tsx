import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Users,
  BarChart3,
  FileCheck,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  PenLine,
  Search,
  Scale,
  Eye,
  UserCheck,
  GitBranch,
  TrendingUp,
  TrendingDown,
  Timer,
  Code2,
  Heart,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "About — Warrant",
  description:
    "Learn about Warrant: an open-source platform enforcing journalistic integrity through reputation, transparency, and fair revenue sharing.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ============================================================ */}
      {/* Hero — Who We Are */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Open source &middot; AGPL-3.0
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Built by citizens who believe
            <br />
            <span className="text-primary">journalism matters</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Warrant is an open-source project created by people who are
            concerned with protecting and advancing journalism and the free
            press. We are not a media company. We are not a newsroom. We are a
            community building infrastructure that makes integrity economically
            rational for independent journalists.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every line of code is public. Every moderation decision is auditable.
            Every rule is documented. If you care about the future of
            journalism, you can inspect how this works — or help build it.
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Why — The Problem */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Why this exists
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            The incentives of digital media are broken. Warrant is an attempt
            to realign them.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">For readers</h3>
                <p className="text-sm text-muted-foreground">
                  There is no easy way to distinguish well-sourced reporting from
                  unsupported claims. Corrections are buried. Repeat inaccuracies
                  carry no consequences. Readers who want high-signal
                  investigative work have nowhere reliable to find it.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <PenLine className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">For journalists</h3>
                <p className="text-sm text-muted-foreground">
                  Independent reporters lack credible distribution channels and
                  fair monetization. Ad-driven platforms reward engagement over
                  accuracy, and journalists who take the time to verify are
                  outcompeted by those who don&apos;t.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">For the ecosystem</h3>
                <p className="text-sm text-muted-foreground">
                  Digital media rewards speed over verification, outrage over
                  truth, and low accountability for repeat inaccuracies. The
                  economic incentives of journalism are misaligned with
                  the public interest.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* How — Our Approach */}
      {/* ============================================================ */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            How we approach it
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            We shift incentives by coupling distribution, revenue, and reputation
            to demonstrated integrity — without becoming a publisher.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Shield,
                title: "Platform, not publisher",
                description:
                  "We do not write, commission, or edit journalists' claims. We enforce standards through gating, labeling, downranking, and removal. This preserves Section 230 protection and keeps editorial independence with the journalist.",
              },
              {
                icon: Scale,
                title: "Truth is a process, not a badge",
                description:
                  "We never claim omniscience. We never say \"verified true.\" Instead, we use process-based states: Supported, Disputed, Needs Source, Correction Issued. Process language is defensible and honest.",
              },
              {
                icon: Eye,
                title: "Everything is auditable",
                description:
                  "Every claim, edit, label, and moderation action is attributable, versioned, and reversible. No silent memory-holing. Dispute resolution relies on a transparent trail.",
              },
              {
                icon: BarChart3,
                title: "Incentives over intentions",
                description:
                  "Revenue, distribution privilege, and reputation are tied to demonstrated integrity — not just engagement. Good intentions don't survive contact with scale. Incentives do.",
              },
              {
                icon: Users,
                title: "Enforcement is distributed",
                description:
                  "Risk is distributed through the reputation system, not concentrated in a moderation team making editorial calls. The system self-corrects through economic and reputational consequences.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-lg border"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* What — Integrity Labels */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            What the labels mean
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Every article on Warrant carries integrity labels that tell you
            the current state of its sourcing and accuracy. Here is what each
            one means.
          </p>

          <div className="grid gap-4">
            {[
              {
                label: "Supported",
                color: "bg-green-500/10 text-green-700 dark:text-green-400",
                badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                icon: CheckCircle,
                description:
                  "Multiple credible sources align with the claims in this article. Source documentation is complete and the author has a strong track record. This is the highest integrity state — it means the reporting process was rigorous, not that the platform guarantees absolute truth.",
              },
              {
                label: "Disputed",
                color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
                badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
                icon: AlertTriangle,
                description:
                  "Credible counter-evidence has been submitted against one or more claims in this article. A dispute does not mean the article is wrong — it means there is a substantive challenge that has not yet been resolved. The article remains available with the label attached so readers can evaluate both sides.",
              },
              {
                label: "Needs Source",
                color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                icon: HelpCircle,
                description:
                  "The article contains factual claims that lack adequate citations or supporting documentation. This may mean sources are missing, incomplete, or unverifiable. The author has been notified and distribution may be reduced until sourcing improves.",
              },
              {
                label: "Correction Issued",
                color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
                badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                icon: PenLine,
                description:
                  "The author has amended one or more claims in this article. Corrections range from minor (typos, clarifications) to major (material factual errors). The full correction history is preserved and visible. Prompt, transparent corrections are treated as a sign of integrity, not failure.",
              },
              {
                label: "Under Review",
                color: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
                badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                icon: Search,
                description:
                  "This article has been flagged for review by the integrity team, typically because it contains high-risk content (such as allegations against named individuals with weak sourcing). It remains visible but with reduced distribution until the review is complete.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex gap-4 p-5 rounded-lg border bg-background"
              >
                <div
                  className={`h-10 w-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className={`mb-2 ${item.badgeColor}`}
                  >
                    {item.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* What — Reputation System */}
      {/* ============================================================ */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            How reputation works
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            Every contributor has a reputation score from 0 to 100 (starting at
            50). Reputation is earned through demonstrated integrity and lost
            through repeated failures. It directly affects how widely your work
            is distributed and how much you earn.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Increases */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Reputation increases
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    {
                      action: "Publishing well-sourced content",
                      delta: "+2.0",
                    },
                    { action: "Your work is cited by others", delta: "+1.5" },
                    { action: "Complete source documentation", delta: "+1.0" },
                    {
                      action: "Dispute overturned in your favor",
                      delta: "+2.0",
                    },
                    { action: "Tenure on the platform", delta: "+0.5" },
                  ].map((item) => (
                    <li key={item.action} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.action}
                      </span>
                      <span className="font-mono text-green-600 dark:text-green-400 shrink-0 ml-2">
                        {item.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Decreases */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-700 dark:text-red-400">
                    Reputation decreases
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    {
                      action: "Dispute upheld against your content",
                      delta: "-5.0",
                    },
                    {
                      action: "Major correction (factual error)",
                      delta: "-3.0",
                    },
                    { action: "Flag upheld against you", delta: "-2.0" },
                    {
                      action: "Minor correction (clarification)",
                      delta: "-0.5",
                    },
                  ].map((item) => (
                    <li key={item.action} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.action}
                      </span>
                      <span className="font-mono text-red-600 dark:text-red-400 shrink-0 ml-2">
                        {item.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-5 rounded-lg border">
            <h3 className="font-semibold mb-2">
              How reputation affects distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Higher reputation means broader initial distribution — your
              articles reach more readers faster. Lower reputation means slower
              distribution and more scrutiny before content surfaces. Very low
              reputation can result in throttled publishing or suspension. This
              creates a direct economic incentive: integrity pays, because it
              earns you more readers and more revenue.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* What — Distribution & Revenue */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Distribution */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                How distribution works
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Articles are ranked by a transparent algorithm — not engagement
                metrics, not ad revenue, not editorial preference. The scoring
                formula is:
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: UserCheck,
                    label: "Author reputation",
                    detail: "Up to 40 points based on track record",
                  },
                  {
                    icon: FileCheck,
                    label: "Source quality",
                    detail:
                      "Up to 25 points for complete, primary sourcing",
                  },
                  {
                    icon: Timer,
                    label: "Recency",
                    detail: "Up to 20 points, decaying over 72 hours",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Integrity penalties",
                    detail:
                      "Disputed (-10), Under Review (-8), Needs Source (-5)",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 items-start">
                    <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                The full algorithm is open source. You can read it in{" "}
                <code className="text-xs">src/services/distribution.ts</code>.
              </p>
            </div>

            {/* Revenue */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                How revenue works
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Subscription revenue flows to the people who do the work.
                The platform takes a small margin to cover infrastructure; the
                rest goes directly to journalists.
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">
                      Journalist pool
                    </span>
                    <span className="text-2xl font-bold text-primary">85%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Distributed proportionally based on readership weighted by an
                    integrity multiplier (0.1x — 1.5x) derived from reputation,
                    corrections, and disputes.
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium">
                      Platform margin
                    </span>
                    <span className="text-2xl font-bold">15%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Covers hosting, infrastructure, payment processing, and
                    integrity operations. This margin is configurable and
                    published transparently.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  We monitor the Gini coefficient of revenue distribution to
                  ensure the system doesn&apos;t collapse into winner-take-all
                  dynamics. Fair distribution is a design goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* What — Verification Is Publication */}
      {/* ============================================================ */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Verification is publication
            </h2>
            <p className="text-muted-foreground mb-6">
              This is one of the most important principles in our integrity
              model, and it is what sets Warrant apart from other platforms.
            </p>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">The problem it solves</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Most platforms create a <strong>liability gap</strong>:
                  the original poster bears all the risk, while those who
                  validate, amplify, or &ldquo;fact-check&rdquo; a claim bear
                  far less. This produces a pattern where low-reputation actors
                  post risky claims and high-reputation actors
                  &ldquo;verify&rdquo; them cheaply — externalizing epistemic
                  risk upward with no consequences.
                </p>
                <Separator className="my-4" />
                <h3 className="font-semibold mb-3">Our rule</h3>
                <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground mb-4">
                  Any account that publicly validates a claim assumes the same
                  responsibility and consequences as if it had published the
                  claim itself.
                </blockquote>
                <p className="text-sm text-muted-foreground">
                  Posting false information results in a reputation penalty.
                  Validating false information results in an{" "}
                  <strong>identical penalty</strong>. This makes endorsement a
                  scarce, high-stakes action. You only validate what you are
                  willing to stake your reputation on.
                </p>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Endorsement becomes scarce",
                  description:
                    "You only validate what you're willing to stake your reputation and revenue on.",
                },
                {
                  title: "Fact-checking becomes adversarial",
                  description:
                    "Copy-paste validation is irrational when it carries real consequences.",
                },
                {
                  title: "False claims propagate backward",
                  description:
                    "When a claim is proven false, penalties hit every validator in the chain.",
                },
              ].map((item) => (
                <div key={item.title} className="p-4 rounded-lg border text-center">
                  <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* What — Identity */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Identity where it matters
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
            We balance accountability with safety. Not everyone needs to be
            identified — but everyone who earns money does.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Readers</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Readers can be fully pseudonymous. You need an email address to
                  subscribe and log in, but your identity is never exposed
                  publicly. You can flag content, suggest corrections, and vote
                  on feature requests without revealing who you are.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Contributors</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revenue-earning journalists must complete identity verification
                  (government ID + liveness check) to confirm they are a real
                  human. This does <strong>not</strong> require using your real
                  name publicly — pseudonymous bylines are fully supported.
                  Verification ensures that bans have real consequences and
                  prevents sockpuppet manipulation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Open Source */}
      {/* ============================================================ */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Code2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Open source, always
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Warrant is licensed under the{" "}
            <strong>GNU Affero General Public License v3 (AGPL-3.0)</strong>.
            Every algorithm, every scoring formula, every moderation rule is
            published in the open. We believe that a platform asking you to trust
            its integrity systems must let you verify them yourself.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            Want to understand how articles are ranked? Read{" "}
            <code className="text-xs">src/services/distribution.ts</code>. Want
            to see how reputation is calculated? Check{" "}
            <code className="text-xs">src/services/integrity.ts</code>. Want to
            audit the revenue split? It&apos;s in{" "}
            <code className="text-xs">src/services/revenue.ts</code>.
          </p>
          <Link
            href="https://github.com/connorpmullins/warrant"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg" className="gap-2">
              <GitBranch className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA */}
      {/* ============================================================ */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-3xl mx-auto text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Support real journalism
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you read, write, or build — there is a place for you here.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed">
              <Button size="lg" className="gap-2">
                Read the Feed
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">
                Become a Contributor
              </Button>
            </Link>
            <Link href="/subscribe">
              <Button size="lg" variant="outline">
                Subscribe
              </Button>
            </Link>
          </div>
          <div className="mt-6">
            <Link
              href="/integrity"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Read our full Integrity Standards
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
