import Ticket from "../../../(models)/Ticket";
import { NextResponse } from "next/server";

export async function DELETE(req, {params}) {
    try {
        const {id} = params;
        await Ticket.findByIdAndDelete(id);
        return NextResponse.json({message: "Ticket Deleted"}, {status: 200});
    } catch (err) {
        console.log(err);
        return NextResponse.json({message: "Error", err}, {status: 500});
    }
}