import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { Phone, Mail } from "lucide-react";
import emailjs from "@emailjs/browser";
import { supabase } from "./supabaseClient";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { FaWhatsapp, FaMapMarkerAlt } from "react-icons/fa";

import { 
  CheckCircle, Car, Shield, DollarSign, MessageCircle, 
  Star, Zap, TrendingUp, ArrowRight, Sparkles, Target, Users, Award 
} from 'lucide-react';

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 50 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Stats counter component
const CountUpNumber = ({ end, duration = 2 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const startCount = 0;
    
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * (end - startCount) + startCount));
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

export default function CarForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    carModel: "",
    carYear: "",
    carPhotos: null,
  });


  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);



  const scrollToForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const [status, setStatus] = useState("");

const handleInputChange = (e) => {
  const { name, value } = e.target;

  // Required field check
  if (!value) {
    Swal.fire({
      icon: "warning",
      title: "Required Field",
      text: `${name === "fullName" ? "Full Name" : name === "carModel" ? "Car Model" : ""} cannot be empty.`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  // Numbers only for phoneNumber and carYear
  if (name === "phoneNumber" && value && !/^\d*$/.test(value)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Phone Number",
      text: "Numbers only are allowed (e,g: 0818174090)",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  if (name === "carYear" && value && !/^\d*$/.test(value)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Car Year",
      text: "Numbers only are allowed (e,g: 2013)",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  setFormData({ ...formData, [name]: value });
};

const handleFileChange = (e) => {
  const files = e.target.files;

  if (!files || files.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "No Photos Selected",
      text: "Please upload at least one photo of your car.",
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }

  setFormData({ ...formData, carPhotos: files });
};



const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.carPhotos || formData.carPhotos.length === 0) {
    setStatus("Please upload at least one image.");
    return;
  }

  setStatus("Uploading images...");

  const imageUrls = [];

  for (let file of formData.carPhotos) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("uploads") // your bucket name
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      setStatus("Failed to upload images.");
      return;
    }

    // Get the public URL for this uploaded image
    const { data: publicData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    imageUrls.push(publicData.publicUrl);
  }

  setStatus("Sending email...");

  // Prepare EmailJS template
  const templateParams = {
    name: formData.fullName,
    title: `Car Submission: ${formData.carModel} (${formData.carYear})`,
    phoneNumber: formData.phoneNumber,
    carModel: formData.carModel,
    carYear: formData.carYear,
    carPhotos: imageUrls.join("\n"), // include all uploaded image URLs
    to_email: "nembridgegroup@gmail.com",
  };

  // Send Email
  emailjs
    .send(
      "nembridge_hgccc",
      "template_nembridge",
      templateParams,
      "K7uIVKnAudurGMv2Q"
    )
    .then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
        setStatus("Form submitted successfully!");
        setFormData({
          fullName: "",
          phoneNumber: "",
          carModel: "",
          carYear: "",
          carPhotos: null,
        });
      },
      (err) => {
        console.log("FAILED...", err);
        setStatus("Oops! Something went wrong. Try again.");
      }
    );
};


  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url('src/media/images/width_768_q70.webp')`
            }}
          />
          <FloatingParticles />
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />

        {/* Content */}
        <motion.div 
          className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-full px-6 py-3 mb-6 border border-white/20"
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-sm">Turn Your Car Into a Money Machine</span>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </motion.div>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-8xl font-black mb-8 leading-none"
          >
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Earn N$8,000+
            </span>
            <span className="block text-white text-3xl md:text-5xl mt-4">
              Monthly Passive Income
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-gray-300 leading-relaxed"
          >
            Let <span className="text-cyan-400 font-semibold">Nembridge</span> transform your idle car into a
            <span className="text-purple-400 font-semibold"> guaranteed income stream</span>. 
            We handle everything while you earn.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={scrollToForm}
                className="relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-6 text-xl rounded-2xl shadow-2xl border-0 overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span className="relative flex items-center gap-3">
                  Start Earning Today
                  <ArrowRight className="w-6 h-6" />
                </span>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-gray-300 text-lg cursor-pointer hover:text-white transition-colors"
            >
              ⚡ Get approved in 24 hours
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              { number: 9000, label: "Average Monthly Income", prefix: "N$" },
              { number: 95, label: "Success Rate", suffix: "%" },
              { number: 50, label: "Happy Car Owners", suffix: "+" },
              { number: 24, label: "Hour Approval", suffix: "h" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.prefix}<CountUpNumber end={stat.number} />{stat.suffix}
                </div>
                <div className="text-gray-400 text-sm mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
        
        <motion.div 
          className="max-w-7xl mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Three simple steps to turn your car into a passive income generator
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Submit Your Car",
                description: "Upload photos and details of your vehicle. Our AI-powered system evaluates your car instantly.",
                icon: Car,
                color: "from-cyan-500 to-blue-600",
                delay: 0
              },
              {
                step: "02", 
                title: "We Handle Everything",
                description: "Insurance, maintenance, professional drivers - all managed by our expert team while you relax.",
                icon: Shield,
                color: "from-purple-500 to-pink-600",
                delay: 0.2
              },
              {
                step: "03",
                title: "Get Paid Monthly",
                description: "Receive guaranteed payments of N$8,000-N$9,000 directly to your bank account every month.",
                icon: DollarSign,
                color: "from-green-500 to-emerald-600",
                delay: 0.4
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-colors duration-300" />
                
                <div className="relative p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className={`text-6xl font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent opacity-30`}>
                      {step.step}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-4">{step.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>
                  
                  <motion.div
                    className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${step.color} rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: step.delay, duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants}>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
                <span className="bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                  Why Choose
                </span>
                <br />Nembridge?
              </h2>
              
              <div className="space-y-8">
                {[
                  {
                    title: "Full Insurance Coverage",
                    description: "Comprehensive protection for your vehicle at zero cost to you",
                    icon: Shield
                  },
                  {
                    title: "Premium Maintenance", 
                    description: "Regular servicing to keep your car in pristine condition",
                    icon: Award
                  },
                  {
                    title: "All Costs Covered",
                    description: "Fuel, cleaning, airtime - everything handled professionally",
                    icon: Target
                  },
                  {
                    title: "Guaranteed Income",
                    description: "Reliable monthly payments with no hidden fees or surprises",
                    icon: TrendingUp
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-6 group cursor-pointer"
                    whileHover={{ x: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-green-400 transition-colors">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="mt-12 p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl border border-green-500/20 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <Zap className="w-8 h-8 text-green-400" />
                  <h3 className="text-2xl font-black text-white">Guaranteed Results</h3>
                </div>
                <p className="text-lg text-green-300">
                  Join 50+ car owners already earning passive income with zero stress and maximum returns.
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl blur-3xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <ImageWithFallback
                src="src/media/images/Yango-Aplicativo-Seguranca.jpeg"
                alt="Modern car fleet"
                className="relative rounded-3xl shadow-2xl w-full h-auto"
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Real people, real results. See how Nembridge is changing lives.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Maria S.",
                role: "Toyota Corolla Owner",
                income: "N$8,500",
                duration: "8 months",
                quote: "Life-changing! I earn more from my car than my part-time job. Nembridge handles everything perfectly.",
                rating: 5
              },
              {
                name: "Johannes M.", 
                role: "Honda Civic Owner",
                income: "N$8,800",
                duration: "1 year",
                quote: "Best investment decision ever. My car pays for itself while I focus on growing my business.",
                rating: 5
              },
              {
                name: "Sarah K.",
                role: "Nissan Sentra Owner", 
                income: "N$9,000",
                duration: "14 months",
                quote: "Consistent, reliable income every month. The team is professional and my car looks better than ever.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 rounded-3xl backdrop-blur-sm border border-white/10 group-hover:border-yellow-500/30 transition-colors duration-300" />
                
                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{testimonial.name}</h3>
                      <p className="text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-300 text-lg italic mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                      <div className="text-green-400 font-black text-lg">{testimonial.income}</div>
                      <div className="text-gray-400 text-sm">Monthly Income</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                      <div className="text-blue-400 font-black text-lg">{testimonial.duration}</div>
                      <div className="text-gray-400 text-sm">With Nembridge</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-32 px-4 bg-gradient-to-br from-gray-900 via-black to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />
        
        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                Start Earning Today
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Submit your car details and join hundreds of successful car owners earning passive income
            </p>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl backdrop-blur-xl border border-white/20" />
            
            <div className="relative p-8 md:p-12">
         
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Full Name */}
          <motion.div whileFocus={{ scale: 1.02 }} className="space-y-2">
            <Label htmlFor="fullName" className="text-white text-lg">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400 transition-colors"
              placeholder="Your full name"
            />
          </motion.div>

          {/* Phone Number */}
          <motion.div whileFocus={{ scale: 1.02 }} className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-white text-lg">Phone Number *</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400 transition-colors"
              placeholder="+264 XX XXX XXXX"
            />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Car Model */}
          <motion.div whileFocus={{ scale: 1.02 }} className="space-y-2">
            <Label htmlFor="carModel" className="text-white text-lg">Car Model *</Label>
            <Input
              id="carModel"
              name="carModel"
              value={formData.carModel}
              onChange={handleInputChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400 transition-colors"
              placeholder="e.g. Toyota Corolla"
            />
          </motion.div>

          {/* Car Year */}
          <motion.div whileFocus={{ scale: 1.02 }} className="space-y-2">
            <Label htmlFor="carYear" className="text-white text-lg">Car Year *</Label>
            <Input
              id="carYear"
              name="carYear"
              value={formData.carYear}
              onChange={handleInputChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400 transition-colors"
              placeholder="e.g. 2018"
            />
          </motion.div>
        </div>

        {/* Car Photos */}
        <motion.div whileFocus={{ scale: 1.02 }} className="space-y-2">
          <Label htmlFor="carPhotos" className="text-white text-lg">Car Photos</Label>
          <Input
            id="carPhotos"
            name="carPhotos"
            type="file"
            multiple onChange={handleFileChange}
            accept="image/*"
            className="bg-white/10 border-white/20 text-white h-14 text-lg rounded-xl backdrop-blur-sm focus:border-cyan-400 transition-colors file:bg-cyan-500 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4"
          />
          <p className="text-gray-400">
            Upload photos of your car (exterior, interior, dashboard)
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4">
          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white py-6 text-xl rounded-2xl shadow-2xl border-0 relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <span className="relative flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6" />
              Submit My Car for Review
              <ArrowRight className="w-6 h-6" />
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Status Message */}
      {status && <p className="mt-4 text-center text-green-400 font-medium">{status}</p>}
    </>
  
            </div>
          </motion.div>
        </motion.div>
      </section>

     {/* Footer */}
<footer className="bg-black text-white py-16 px-4 border-t border-white/10">
  <motion.div 
    className="max-w-7xl mx-auto"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={containerVariants}
  >
    <div className="grid md:grid-cols-3 gap-12">
      {/* About */}
      <motion.div variants={itemVariants}>
        <h3 className="text-3xl font-black mb-6">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Nembridge Logistics
          </span>
        </h3>
        <p className="text-gray-400 text-lg leading-relaxed mb-6">
          Professional car management services for Yango. Transform your car into a passive income generator.
        </p>
        <div className="flex gap-4">
          {[
            { name: "instagram", url: "https://www.instagram.com/nembridge.na/", icon: <FaInstagram size={22} /> },
            { name: "tiktok", url: "https://www.tiktok.com/@nambridge.na", icon: <FaTiktok size={22} /> },
          ].map(({ name, url, icon }) => (
            <motion.a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.2, y: -2 }}
              className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center cursor-pointer text-white"
            >
              {icon}
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Contact Info */}
      <motion.div variants={itemVariants}>
        <h4 className="text-xl font-black mb-6 text-white">Contact Information</h4>
        <div className="space-y-4">
          {[
            { icon: Phone, text: "+264 818174090", color: "from-green-400 to-emerald-600", link: "tel:+264818174090" },
            { icon: Mail, text: "info@nembridge.com", color: "from-blue-400 to-cyan-600", link: "mailto:info@nembridge.com" },
            { icon: FaWhatsapp, text: "WhatsApp Support", color: "from-green-500 to-green-700", link: "https://wa.me/264818174090" },
            { icon: FaMapMarkerAlt, text: "Erf 9 Potgieter Street, Pioneerspark, Windhoek", color: "from-red-500 to-orange-600", link: "https://www.google.com/maps/place/Erf+9+Potgieter+Street,+Pioneerspark,+Windhoek" }
          ].map((contact, index) => (
            <motion.a
              key={index}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 10 }}
              className="flex items-center gap-4 cursor-pointer group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${contact.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <contact.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300 group-hover:text-white transition-colors">{contact.text}</span>
            </motion.a>
          ))}
        </div>
      </motion.div>

      
    </div>

    {/* Fancy Interactive Map */}
    <motion.div
      variants={itemVariants}
      className="mt-12 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.4)] border border-cyan-500/20"
      whileHover={{ scale: 1.02 }}
    >
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.495689115217!2d17.06488417530122!3d-22.597957679473705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1c0b1ae31e1cfd77%3A0x5ef838b23ec908e6!2sPotgieter%20Street%2C%20Windhoek!5e0!3m2!1sen!2sna!4v1756258738018!5m2!1sen!2sna"
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </motion.div>

    {/* Bottom Legal */}
    <motion.div 
      variants={itemVariants}
      className="border-t border-white/10 mt-12 pt-12 text-center"
    >
      <p className="text-gray-400 text-lg mb-4">
        &copy; 2025 Nembridge Logistics Group CC. All rights reserved.
      </p>
      <p className="text-gray-500 text-sm max-w-4xl mx-auto">
        Legal Disclaimer: Earnings may vary based on market conditions and vehicle usage. 
        All terms subject to contract agreement. Nembridge is not responsible for collecting PII or securing sensitive personal data.
      </p>
    </motion.div>
  </motion.div>
</footer>


    </div>
  );
}