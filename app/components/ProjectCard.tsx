"use client";

import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chip from "@/components/chip";
import ProjectDetailsButton from "@/app/(private)/project-hub/ProjectDetailsButton";
import { toast } from "@/components/ui/use-toast";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useState } from "react";
import dayjs from "dayjs";
interface ProjectCardProps {
  package_id: number;
  title: string;
  description: string;
  tags: string[];
  duration: string;
  sessions: number;
  time: string;
  day: string;
  startDate: string;
  endDate: string;
  mentor_user: string;
  spotsLeft: number;
  price: number;
  agenda: { description: string }[];
  tools: { title: string; url: string }[];
  prerequisites: { title: string; url: string }[];
  isMentor?: boolean;
}

export default function ProjectCard({
  package_id,
  title,
  description,
  tags,
  duration,
  isMentor,
  sessions,
  time,
  mentor_user,
  day,
  startDate,
  endDate,
  spotsLeft,
  price,
  agenda,
  tools,
  prerequisites,
}: ProjectCardProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const bookSlotAPI = async (
    order: any,
    mentor_user: string,
    startDate: string,
    session_number: number,
    package_id: number
  ) => {
    const start_time = dayjs(startDate)
      .add(session_number, "day")
      .format("YYYY-MM-DD");
    const end_time = dayjs(start_time).add(1, "hour").format("YYYY-MM-DD");
    return fetch("/api/book_slot", {
      method: "POST",
      body: JSON.stringify({
        for_user: mentor_user,
        start_time,
        end_time,
        payment_id: order.id,
        package_id,
      }),
    });
  };

  const onBuyPackage = async (order: any) => {
    setShowPaymentDialog(true);
  };
  // const handlePaymentSuccess = async (order: any) => {
  //   console.log("Payment success", order);
  //   const response = {
  //     id: "7HB08823YP7257228",
  //     intent: "CAPTURE",
  //     status: "COMPLETED",
  //     purchase_units: [
  //         {
  //             "reference_id": "default",
  //             "amount": {
  //                 "currency_code": "USD",
  //                 "value": "1089.00"
  //             },
  //             "payee": {
  //                 "email_address": "sb-dt8qw41484342@business.example.com",
  //                 "merchant_id": "GMF25SXL8GB2E"
  //             },
  //             "shipping": {
  //                 "name": {
  //                     "full_name": "John Doe"
  //                 },
  //                 "address": {
  //                     "address_line_1": "1 Main St",
  //                     "admin_area_2": "San Jose",
  //                     "admin_area_1": "CA",
  //                     "postal_code": "95131",
  //                     "country_code": "US"
  //                 }
  //             },
  //             "payments": {
  //                 "captures": [
  //                     {
  //                         "id": "5U307570YT931411E",
  //                         "status": "COMPLETED",
  //                         "amount": {
  //                             "currency_code": "USD",
  //                             "value": "1089.00"
  //                         },
  //                         "final_capture": true,
  //                         "seller_protection": {
  //                             "status": "ELIGIBLE",
  //                             "dispute_categories": [
  //                                 "ITEM_NOT_RECEIVED",
  //                                 "UNAUTHORIZED_TRANSACTION"
  //                             ]
  //                         },
  //                         "create_time": "2025-05-22T09:13:25Z",
  //                         "update_time": "2025-05-22T09:13:25Z"
  //                     }
  //                 ]
  //             }
  //         }
  //     ],
  //     "payer": {
  //         "name": {
  //             "given_name": "John",
  //             "surname": "Doe"
  //         },
  //         "email_address": "sb-rdnl041518730@personal.example.com",
  //         "payer_id": "XEAQCSKUYL4EL",
  //         "address": {
  //             "country_code": "US"
  //         }
  //     },
  //     "create_time": "2025-05-22T09:13:06Z",
  //     "update_time": "2025-05-22T09:13:26Z",
  //     "links": [
  //         {
  //             "href": "https://api.sandbox.paypal.com/v2/checkout/orders/7HB08823YP7257228",
  //             "rel": "self",
  //             "method": "GET"
  //         }
  //     ]
  // }
  //   try {
  //     const book

  //   } catch (error) {
  //     console.error("Payment error", error);
  //   }

  //   // try {
  //   //   const res = await fetch("/api/book_slot", {
  //   //     method: "POST",
  //   //     body: JSON.stringify({
  //   //       for_user: mentor.id,
  //   //       // start_time,
  //   //       // end_time,
  //   //       payment_id: order.id,
  //   //     }),
  //   //   });

  //   //   if (!res.ok) {
  //   //     const error = await res.json();
  //   //     throw new Error(error.message || "Failed to book slot");
  //   //   }

  //   //   toast({
  //   //     description: "Slot booked successfully",
  //   //   });

  //   //   setShowPaymentDialog(false);
  //   // } catch (error) {
  //   //   console.error("Booking error:", error);
  //   //   toast({
  //   //     description:
  //   //       error instanceof Error
  //   //         ? error.message
  //   //         : "Failed to book slot. Please contact support.",
  //   //     variant: "destructive",
  //   //   });
  //   // } finally {
  //   // }
  // };

  const handlePaymentError = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentCancel = () => {
    setShowPaymentDialog(false);
  };

  const handlePaymentSuccess = async (order: any) => {
    // setShowPaymentDialog(true);

    // TODO: Implement buy package
    /* later
    // create 8 bookings attached to package id
    /*
    
    bookings:
    - package_id
    - payment_id
    - status
    - start_date
    - end_date
    - status
    */
    // schedule 8 bookings on google calendar
    // trigger email to mentor -> google invite for now
    const session_count = 2;
    const bookingsAPI = new Array(session_count).fill(0).map((_, index) => {
      return bookSlotAPI(order, mentor_user, startDate, index, package_id);
    });

    const res = await Promise.all(bookingsAPI);
    console.log("Bookings API", res);
    setShowPaymentDialog(false);
  };

  const onEdit = () => {
    console.log("Edit Project");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-[30%] max-w-sm flex flex-col justify-between ">
      <div>
        <h2 className="text-2xl font-bold mb-1">{title}</h2>

        <p className="text-gray-500 mb-3 text-base leading-snug line-clamp-2">
          <span>{description}</span>
        </p>
        <div className="flex gap-2 mb-4">
          {tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        <div className="grid grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{sessions} Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{startDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>{day}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{time}</span>
          </div>
        </div>

        <div className="text-base mb-2 mt-2">
          {/* Time duration :{" "} */}
          <span className="font-medium">
            {startDate} to {endDate}
          </span>
        </div>
        {!spotsLeft ? null : isMentor ? (
          <div className="flex items-center  gap-2 font-medium">
            <Users className="w-5 h-5" />
            <span>
              {spotsLeft} Student{spotsLeft === 1 ? "" : "s"}
            </span>
            <div className="flex-1"></div>
            <span className="text-gray-500 text-sm">Price: ${price}</span>
          </div>
        ) : (
          <div className="flex items-center  gap-2 text-green-600 font-medium">
            <Users className="w-5 h-5" />
            <span>
              {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
            </span>
          </div>
        )}
      </div>
      <div className="border-t pt-4 mt-2 flex flex-col gap-2">
        {!isMentor && (
          <div className="flex items-center justify-between">
            <span className="text-lg">Price:</span>
            <span className="text-2xl font-bold">${price}</span>
          </div>
        )}
        {isMentor ? (
          <Button className="w-full mt-2 text-lg py-6" onClick={onEdit}>
            Edit Details
          </Button>
        ) : (
          <>
            <Button className="w-full mt-2 text-lg py-6" onClick={onBuyPackage}>
              Buy Package
            </Button>
            <ProjectDetailsButton
              project={{
                title,
                description,
                tags: ["Tag 1", "Tag 2", "Tag 3"],
                duration,
                sessions,
                startDate,
                endDate,
                time,
                day,
                agenda,
                tools,
                prerequisites,
              }}
            />
          </>
        )}
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          amount={price}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      </div>
    </div>
  );
}
