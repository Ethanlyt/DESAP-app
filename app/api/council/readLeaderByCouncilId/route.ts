import db from "@/shared/providers/dbProvider";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const urlParams = new URL(request.url).searchParams;
		const councilId = urlParams.get("councilId");

		if (!councilId) {
			return NextResponse.json({
				error: "Missing council id",
				status: 400,
			});
		}

		const ledaerInCouncil = await db.council.findUnique({
			where: {
				id: parseInt(councilId),
			},
			select: {
				leaderEmail: true,
			},
		});

		const leader = await db.user.findUnique({
			where: {
				email: ledaerInCouncil?.leaderEmail,
			},
			select: {
				id: true,
				userName: true,
				email: true,
				role: true,
				livingAddress: true,
			},
		});

		if (!leader) {
			return NextResponse.json({
				error: "No users in the council",
				status: 200,
			});
		}
		return NextResponse.json({
			data: leader,
			message: "Council's Leader loaded",
			status: 200,
		});
	} catch (error) {
		return NextResponse.json({
			error: "Something went wrong",
			status: 400,
		});
	}
}
