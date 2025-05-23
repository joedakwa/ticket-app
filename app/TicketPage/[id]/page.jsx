import TicketForm from "@/app/(components)/TicketForm";

const getTicketDataById = async (id) => {
  try {
    const res = await fetch(`http://localhost:3007/api/Tickets/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch ticket data");
    }

    const data = await res.json();
    return data.ticket; // Make sure to return the ticket property
  } catch (error) {
    console.error("Error fetching ticket:", error);
    throw error;
  }
};

const TicketPage = async ({ params }) => {
  const EDITMODE = params.id !== "new";
  let ticketData = { _id: "new" };

  if (EDITMODE) {
    try {
      ticketData = await getTicketDataById(params.id);
    } catch (error) {
      console.error("Error loading ticket:", error);
    }
  }

  return <TicketForm ticket={ticketData} />;
};

export default TicketPage;
