import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Brain, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initiateGitHubLogin } from "../auth/actions";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex-1">
				{/* Hero Section */}
				<section className="container mx-auto px-4 py-20 text-center">
					<div className="max-w-4xl mx-auto">
						<Badge variant="outline" className="mb-4">
							🧠 Your Digital Memory
						</Badge>
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
							Your{" "}
							<span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
								Second Brain
							</span>
						</h1>
						<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
							Organize your thoughts, capture ideas, and build a personal knowledge system that
							grows with you. Transform information into insights.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
							<Button
								size="lg"
								className="group"
								onClick={() => {
									initiateGitHubLogin();
								}}
							>
								Get Started
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</Button>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section className="container mx-auto px-4 py-20">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold mb-4">Everything you need to think better</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Build a system that helps you connect ideas, organize knowledge, and make better
							decisions.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<Card className="border-border/50 hover:border-border transition-colors">
							<CardHeader>
								<Brain className="h-10 w-10 text-primary mb-4" />
								<CardTitle>Intelligent Organization</CardTitle>
								<CardDescription>
									Automatically categorize and connect your notes with AI-powered insights and
									semantic linking.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-border/50 hover:border-border transition-colors">
							<CardHeader>
								<BookOpen className="h-10 w-10 text-primary mb-4" />
								<CardTitle>Knowledge Graph</CardTitle>
								<CardDescription>
									Visualize connections between ideas and discover patterns in your thinking with
									interactive graphs.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-border/50 hover:border-border transition-colors">
							<CardHeader>
								<Lightbulb className="h-10 w-10 text-primary mb-4" />
								<CardTitle>Smart Insights</CardTitle>
								<CardDescription>
									Get suggestions for new connections and rediscover forgotten ideas through
									intelligent recommendations.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</section>
			</div>

			{/* Footer */}
			<footer className="border-t bg-muted/50 mt-auto">
				<div className="container mx-auto px-4 py-8">
					<div className="flex flex-col sm:flex-row justify-center items-center">
						<p className="text-sm text-muted-foreground">
							© 2025 Second Brain | Built with ❤️ by thitiph0n (and AI of course)
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
