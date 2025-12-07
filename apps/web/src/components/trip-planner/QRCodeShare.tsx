import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";

interface QRCodeShareProps {
	url: string;
	size?: number;
	className?: string;
}

export function QRCodeShare({ url, size = 200, className }: QRCodeShareProps) {
	const ref = useRef<SVGSVGElement>(null);

	const handleDownload = () => {
		if (!ref.current) return;

		const svgData = new XMLSerializer().serializeToString(ref.current);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		const img = new Image();

		img.onload = () => {
			canvas.width = size;
			canvas.height = size;
			ctx?.drawImage(img, 0, 0);
			const pngFile = canvas.toDataURL("image/png");

			const downloadLink = document.createElement("a");
			downloadLink.download = "trip-qr-code.png";
			downloadLink.href = pngFile;
			downloadLink.click();
		};

		img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
	};

	return (
		<div className={`flex flex-col items-center gap-4 ${className}`}>
			<div className="p-4 bg-white rounded-lg border shadow-sm">
				<QRCodeSVG
					value={url}
					size={size}
                    ref={ref}
					level={"H"}
					includeMargin={true}
				/>
			</div>
			<Button variant="outline" size="sm" onClick={handleDownload}>
				<Download className="w-4 h-4 mr-2" />
				Download QR Code
			</Button>
		</div>
	);
}
