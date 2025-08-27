import TicketCard from "./(components)/TicketCard";

// Make this page dynamic to avoid build-time issues
export const dynamic = 'force-dynamic';

const getTickets = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/Tickets`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error('Failed to fetch tickets');
    }
    return res.json();
  } catch (err) {
    console.log("failed to get tickets", err);
    return { tickets: [] }; // Return empty array if fetch fails
  }
};

const Dashboard = async () => {
  const data = await getTickets();
  const tickets = data?.tickets || [];

  const uniqueCategories = [
    ...new Set(tickets?.map(({ category }) => category)),
  ];

  return (
    <div className="p-5">
      <div>
        {tickets &&
          uniqueCategories?.map((uniqueCategory, categoryIndex) => (
            <div key={categoryIndex} className="mb-4">
              <h2>{uniqueCategory}</h2>
              <div className="lg:grid grid-cols-2 xl:grid-cols-4">
                {tickets
                  .filter((ticket) => ticket.category === uniqueCategory)
                  .map((filteredTicket, _index) => (
                    <TicketCard
                      id={_index}
                      key={_index}
                      ticket={filteredTicket}
                    />
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Dashboard;
