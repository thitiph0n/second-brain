import { createFileRoute } from "@tanstack/react-router";
import { CouponDemo } from "../../demo/CouponDemo";

export const Route = createFileRoute("/demo/coupons")({
	component: CouponDemoRoute,
});

function CouponDemoRoute() {
	return <CouponDemo />;
}
