import React, { useRef } from 'react';
import { Download, FileText, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { toast } from '../../lib/toast';

export const Legal: React.FC = () => {
    const contentRef = useRef<HTMLDivElement>(null);

    const downloadPDF = async () => {
        if (!contentRef.current) return;
        
        toast.info("Generating PDF Document...");
        
        try {
            // Using html-to-image to capture styling, then putting into PDF
            const dataUrl = await toPng(contentRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('Sauki_Mart_Privacy_Terms.pdf');
            toast.success("Document Downloaded");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate PDF");
        }
    };

    return (
        <div className="p-6 pb-32">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6" /> Legal Center
                    </h1>
                    <p className="text-slate-500 text-sm">Privacy Policy & Terms of Service</p>
                </div>
                <Button onClick={downloadPDF} variant="outline" className="w-auto h-10 px-4">
                    <Download className="w-4 h-4" />
                </Button>
            </div>

            <div ref={contentRef} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose prose-slate max-w-none text-sm leading-relaxed">
                <div className="text-center mb-8 border-b pb-8">
                    <img src="/logo.png" alt="Sauki Mart" className="w-20 h-20 mx-auto object-contain mb-4" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">Official Legal Document</h2>
                    <p className="text-slate-500">Effective Date: December 29, 2025</p>
                </div>

                <div className="space-y-12">
                    <section>
                        <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-600 pl-3">Privacy Policy</h3>
                        
                        <h4 className="font-bold mt-4">1. Introduction</h4>
                        <p>Sauki Data Links ("we," "us," "our," or "the Company") is committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information when you use the SAUKI MART mobile application.</p>
                        
                        <h4 className="font-bold mt-4">2. Data Collection</h4>
                        <p>We collect information you provide directly (Contact details like Phone number, name) and information collected automatically (Device information, IP address) for service delivery and fraud prevention. We also receive payment verification data from Flutterwave.</p>

                        <h4 className="font-bold mt-4">3. Data Usage</h4>
                        <p>We use your data to provide services, verify transactions, communicate with you, and comply with legal obligations under the Nigeria Data Protection Act 2023 ("NDPA").</p>

                        <h4 className="font-bold mt-4">4. Data Sharing</h4>
                        <p>We share data with partners like Flutterwave (payments) and Telecommunication providers (MTN, Airtel, Glo, 9mobile) solely for service delivery.</p>

                        <h4 className="font-bold mt-4">5. Contact Us</h4>
                        <p><strong>Email:</strong> saukidatalinks@gmail.com<br/><strong>Phone:</strong> 09024099561 and 09076872520<br/><strong>Address:</strong> The CEO, Sauki Data Links, Nigeria.</p>
                    </section>

                    <section>
                         <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-slate-900 pl-3">Terms of Service</h3>
                         
                         <h4 className="font-bold mt-4">1. Services</h4>
                         <p>The App facilitates virtual top-up (VTU) services and e-commerce for mobile devices. We do not own the telecommunication networks.</p>

                         <h4 className="font-bold mt-4">2. Payments & Refunds</h4>
                         <p>All sales for Airtime/Data are final upon delivery. Refunds are issued only for failed deliveries verified within 24-48 hours. Physical products have a 7-day return window for defects.</p>

                         <h4 className="font-bold mt-4">3. Liability</h4>
                         <p>Services are provided "as is". We are not liable for network failures caused by third-party providers.</p>

                         <h4 className="font-bold mt-4">4. Governing Law</h4>
                         <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t text-center text-xs text-slate-400">
                    <p>© 2025 Sauki Data Links. All Rights Reserved.</p>
                    <p>SMEDAN Certified Organization.</p>
                </div>
            </div>
        </div>
    );
};