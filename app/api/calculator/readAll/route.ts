import db from "@/shared/providers/dbProvider";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const analytics = await db.analytics.findMany({
			select: {
				id: true,
				createdAt: true,
				imageURL: true,
				createdBy: {
					select: {
						userName: true,
						email: true,
					},
				},
				status: true,
				predictions: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
		if (!analytics) {
			return NextResponse.json({
				error: "There are no analytics",
				status: 404,
			});
		}

		return NextResponse.json({
			data: analytics,
			message: "All analytics loaded",
			status: 200,
		});
	} catch (error) {
		return NextResponse.json({
			error: "Something went wrong",
			status: 400,
		});
	}
}
