import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, BarChart3, Shield, Zap, Users, Phone, Mail, ArrowRight, CheckCircle, Star, Sparkles, Brain, Cloud, Database, Lock, Cpu, Network, Globe, Lightbulb, TrendingUp, Code, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
export function IBMLandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const features = [{
    icon: Brain,
    title: "Watson AI Integration",
    description: "Leverage IBM Watson's cognitive computing for intelligent complaint resolution",
    color: "from-blue-600 to-cyan-600"
  }, {
    icon: Cloud,
    title: "Hybrid Cloud Architecture",
    description: "Deploy on IBM Cloud with hybrid infrastructure for maximum flexibility",
    color: "from-purple-600 to-indigo-600"
  }, {
    icon: Database,
    title: "Advanced Analytics",
    description: "IBM Cognos Analytics for deep insights and predictive modeling",
    color: "from-green-600 to-emerald-600"
  }, {
    icon: Shield,
    title: "Enterprise Security",
    description: "IBM Security framework with zero-trust architecture",
    color: "from-red-600 to-rose-600"
  }, {
    icon: Code,
    title: "API-First Design",
    description: "RESTful APIs built with IBM's enterprise-grade standards",
    color: "from-orange-600 to-yellow-600"
  }, {
    icon: Network,
    title: "Real-time Processing",
    description: "IBM Event Streams for real-time data processing and analytics",
    color: "from-teal-600 to-cyan-600"
  }];
  const solutions = [{
    title: "AI-Powered Resolution",
    description: "Watson AI analyzes complaints and provides instant, intelligent responses",
    icon: Brain,
    metrics: "85% auto-resolution rate"
  }, {
    title: "Predictive Analytics",
    description: "Forecast complaint trends and prevent issues before they escalate",
    icon: TrendingUp,
    metrics: "40% reduction in complaints"
  }, {
    title: "Multi-Channel Integration",
    description: "Unified experience across web, mobile, voice, and social channels",
    icon: Globe,
    metrics: "360° customer view"
  }, {
    title: "Intelligent Routing",
    description: "Smart assignment to the right agent based on skills and workload",
    icon: Settings,
    metrics: "50% faster resolution"
  }];
  const stats = [{
    value: "500M+",
    label: "Complaints Processed",
    icon: MessageCircle
  }, {
    value: "99.99%",
    label: "System Uptime",
    icon: Cpu
  }, {
    value: "2.5s",
    label: "Avg Response Time",
    icon: Zap
  }, {
    value: "150+",
    label: "Countries Served",
    icon: Globe
  }];
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-ping" />
      </div>

      {/* Navigation */}
      

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8
          }} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Powered by Advanced AI</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                  Enterprise
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent block">
                    AI Solutions
                  </span>
                  for Complaint Management
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                  Transform customer service with IBM's cognitive computing, advanced analytics, 
                  and enterprise-grade security. Built for scale, designed for results.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl">
                  <Lightbulb className="mr-2 w-5 h-5" />
                  Start Free Trial
                </Button>
                
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => <motion.div key={stat.label} initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                duration: 0.6,
                delay: index * 0.1
              }} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>)}
              </div>
            </motion.div>

            {/* Right Interactive Dashboard */}
            <motion.div initial={{
            opacity: 0,
            x: 50
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="relative">
              {/* Main Dashboard */}
              <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="/lovable-uploads/c1a2cfd7-58de-4fec-82b9-1ef5eb5bb98f.png" alt="IBM Logo" className="h-6 w-auto" />
                    <span className="text-sm text-gray-400">ComplainDesk Dashboard</span>
                  </div>
                </div>

                {/* Interactive Feature Showcase */}
                <div className="space-y-4 mb-6">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeFeature} initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} exit={{
                    opacity: 0,
                    y: -20
                  }} transition={{
                    duration: 0.5
                  }} className="p-4 rounded-2xl bg-gradient-to-r from-white/10 to-transparent border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${features[activeFeature].color} flex items-center justify-center`}>
                          {React.createElement(features[activeFeature].icon, {
                          className: "w-5 h-5 text-white"
                        })}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{features[activeFeature].title}</h3>
                          <p className="text-sm text-gray-300">{features[activeFeature].description}</p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Feature Pills */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {features.map((_, index) => <div key={index} className={`h-2 rounded-full transition-all duration-300 ${index === activeFeature ? 'bg-blue-500' : 'bg-white/20'}`} />)}
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <div className="flex items-center justify-between">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-bold">↑ 23%</span>
                    </div>
                    <div className="text-white font-semibold mt-2">Resolution Rate</div>
                    <div className="text-2xl font-bold text-white">94.7%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <Zap className="w-6 h-6 text-blue-400" />
                      <span className="text-blue-400 font-bold">↓ 45%</span>
                    </div>
                    <div className="text-white font-semibold mt-2">Response Time</div>
                    <div className="text-2xl font-bold text-white">1.2s</div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              

              
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24 relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">Enterprise-Grade</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent block">
                AI Solutions
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by IBM Watson's cognitive computing and advanced machine learning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => <motion.div key={solution.title} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: index * 0.1
          }} viewport={{
            once: true
          }} whileHover={{
            y: -10
          }} className="group bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-blue-500/50 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <solution.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">{solution.title}</h3>
                <p className="text-gray-300 leading-relaxed mb-4">{solution.description}</p>
                <div className="text-blue-400 font-semibold text-sm">{solution.metrics}</div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Experience the Power
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              See how IBM Watson AI transforms complaint management in real-time
            </p>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg rounded-xl" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? 'Pause Demo' : 'Play Interactive Demo'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>

          {/* Demo Interface */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="max-w-6xl mx-auto bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Chat Interface */}
              <div className="lg:col-span-2 bg-black/20 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Live Watson AI Assistant
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {/* Demo messages would go here */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl max-w-xs">
                      My order hasn't arrived yet and it's been 2 weeks!
                    </div>
                  </div>
                  <div className="flex">
                    <div className="bg-white/10 text-white px-4 py-2 rounded-2xl max-w-xs">
                      I understand your concern. Let me check your order status immediately. 
                      I've found your order and can see it's experiencing a delay. I'm processing 
                      a full refund and expedited replacement right now.
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Panel */}
              <div className="bg-black/20 rounded-2xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Real-time Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Sentiment Score</span>
                    <span className="text-green-400 font-bold">+0.87</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Confidence</span>
                    <span className="text-blue-400 font-bold">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Resolution Time</span>
                    <span className="text-purple-400 font-bold">1.2s</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }} className="text-center bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-3xl p-12 border border-blue-500/30 backdrop-blur-xl">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Join Fortune 500 companies using IBM ComplainDesk AI to revolutionize customer service
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl">
                Start Enterprise Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
            </div>
          </motion.div>
        </div>
      </section>
    </div>;
}