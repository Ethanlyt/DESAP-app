import supabase from "@/shared/providers/supabase";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	CircularProgress,
	Dialog,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	MenuItem,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { CheckingStatus } from "@prisma/client";
import axios from "axios";
import {
	MRT_ColumnDef,
	MaterialReactTable,
	useMaterialReactTable,
} from "material-react-table";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FaArrowAltCircleDown } from "react-icons/fa";
import useSWR from "swr";
import NotFoundComponet from "../notfound";

type AnalysisTableProps = {
	id: number;
	createdAt: string;
	larvaeNumber: number;
	status: string;
	predictions: {
		image: {
			width: number;
			height: number;
		};
		predictions: [
			{
				class: string;
				class_id: number;
				confidence: number;
				detection_id: string;
				height: number;
				width: number;
				x: number;
				y: number;
			}
		];
		time: string;
	};
	createdBy: {
		userName: string;
		email: string;
	};
	imageURL: string;
};

const AnalysisTable = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingSaving, setIsLoadingSaving] = useState(false);
	const [openViewDetails, setOpenViewDetails] = useState(false);
	const [openViewImage, setOpenViewImage] = useState(false);
	const [analysis, setAnalysis] = useState<AnalysisTableProps[]>([]);
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down("xl"));
	const [detail, setDetail] = useState<AnalysisTableProps | null>(null);
	const [rawImage, setRawImage] = useState("");
	const [annotatedImage, setAnnotatedImage] = useState("");

	const {
		data: analysisResponse,
		isLoading: isLoadingAnalyticsResponse,
		mutate: mutateAnalytics,
	} = useSWR(
		"/api/calculator/readAll",
		(url: string | URL | Request): Promise<any> =>
			fetch(url).then((res) => res.json())
	);

	const handleClose = () => {
		setOpenViewDetails(false);
		setOpenViewImage(false);
		setDetail(null);
		setRawImage("");
		setAnnotatedImage("");
	};
	const handleViewDetails = (row: AnalysisTableProps) => {
		setOpenViewDetails(true);
		setDetail(row);
	};

	const handleViewImage = async (row: AnalysisTableProps) => {
		setIsLoading(true);
		setOpenViewImage(true);
		const { data: rawImage, error } = await supabase.storage
			.from("image")
			.download(row.imageURL);
		if (error) throw error;
		const downloadUrl = URL.createObjectURL(rawImage);
		if (rawImage === null) {
			return;
		}
		const response = await fetch(downloadUrl);
		const data = await response.blob();
		const imageFile = new File([data], "image.jpeg", {
			type: "image/jpeg",
		});
		const formData = new FormData();
		formData.append("image", imageFile);
		formData.append("predictions", JSON.stringify(row.predictions));
		const annotatedImage = await axios({
			method: "POST",
			url: "https://larvae-calculator-api.vercel.app/calculate/larvae",
			data: formData,
			headers: {
				"Content-Type": "multipart/form-data",
			},
			responseType: "blob",
		});
		const annotatedImageLink = URL.createObjectURL(annotatedImage.data);
		setRawImage(downloadUrl);
		setAnnotatedImage(annotatedImageLink);
		setIsLoading(false);
	};

	const handleSaveAnalysis = async (row: AnalysisTableProps) => {
		setIsLoadingSaving(true);
		const res = await fetch("/api/calculator/updateStatus", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(row),
		});
		mutateAnalytics();
		setIsLoadingSaving(false);
	};

	const handleDeleteAnalysis = async (row: AnalysisTableProps) => {
		setIsLoadingSaving(true);
		const res = await fetch(`/api/calculator/delete?id=${row.id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		});
		mutateAnalytics();
		setIsLoadingSaving(false);
	};

	useEffect(() => {
		if (analysisResponse) {
			setAnalysis(analysisResponse.data);
		} else {
			setAnalysis([]);
		}
	}, [analysisResponse]);

	const columns = useMemo<MRT_ColumnDef<AnalysisTableProps>[]>(
		() => [
			{
				accessorKey: "createdAt",
				header: "Analysis Datetime",
				Cell: ({ cell }) =>
					new Date(cell.getValue() as string).toLocaleString(),
				enableEditing: false,
			},
			{
				accessorKey: "predictions.predictions.length",
				header: "Larvae Count",
			},
			{
				accessorKey: "status",
				header: "Analysis Status",
			},
			{
				accessorKey: "createdBy.userName",
				header: "Analyzed By (Username)",
				enableEditing: false,
			},
			{
				accessorKey: "createdBy.email",
				header: "Analyzed By (Email)",
				enableEditing: false,
			},
		],
		[]
	);

	const table = useMaterialReactTable({
		columns,
		data: analysis,
		enableHiding: false,
		enableDensityToggle: false,
		enableRowActions: true,
		defaultColumn: {
			minSize: 20,
			maxSize: 50,
		},
		initialState: {
			density: "comfortable",
		},
		state: {
			isLoading: isLoadingAnalyticsResponse && isLoadingSaving,
		},
		renderRowActionMenuItems: ({ row }) => [
			<MenuItem
				key='markChecked'
				onClick={() => {
					handleSaveAnalysis(row.original);
				}}
				hidden={
					CheckingStatus.CHECKED.toString() === row.original.status
				}
				sx={{ display: "flex", justifyContent: "space-between" }}
			>
				Mark CHECKED
				<CheckCircleIcon />
			</MenuItem>,
			<MenuItem
				key='contact'
				onClick={() =>
					window.open(
						`mailto:${row.original.createdBy.email}?subject=Enquiry of Analysis (Analysis ID: ${row.original.id})`
					)
				}
				sx={{ display: "flex", justifyContent: "space-between" }}
			>
				Contact
				<EmailIcon />
			</MenuItem>,
			<MenuItem
				key='viewDetails'
				onClick={() => handleViewDetails(row.original)}
				sx={{ display: "flex", justifyContent: "space-between" }}
			>
				View Details
				<VisibilityIcon />
			</MenuItem>,
			<MenuItem
				key='viewImage'
				onClick={() => handleViewImage(row.original)}
				sx={{ display: "flex", justifyContent: "space-between" }}
			>
				View Image
				<FullscreenIcon />
			</MenuItem>,
			<MenuItem
				key='deleteRecord'
				onClick={() => handleDeleteAnalysis(row.original)}
				sx={{ display: "flex", justifyContent: "space-between" }}
			>
				Delete Record
				<DeleteIcon />
			</MenuItem>,
		],
	});

	return analysis ? (
		<>
			<MaterialReactTable table={table} />
			{/* View Prediction Detail */}
			<Dialog
				fullScreen={fullScreen}
				open={openViewDetails}
				onClose={handleClose}
			>
				<DialogTitle>Analysis Detail</DialogTitle>
				<IconButton
					aria-label='close'
					onClick={handleClose}
					size='small'
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
					}}
				>
					<CloseIcon />
				</IconButton>
				<DialogContent>
					<DialogContentText>
						Analysis ID: {detail?.id}
					</DialogContentText>
					<Divider />
					<DialogContentText>
						Analysis Time: {detail?.predictions.time} seconds
					</DialogContentText>
					<Divider />
					<DialogContentText>
						Image Size: {detail?.predictions.image.width} x{" "}
						{detail?.predictions.image.height}
					</DialogContentText>
					<Divider />
					<DialogContentText>
						Prediction Metadata:{" "}
						{detail?.predictions.predictions.map(
							(prediction, index) => (
								<span key={index}>
									{JSON.stringify(prediction)}
								</span>
							)
						)}
					</DialogContentText>
					<Divider />
				</DialogContent>
			</Dialog>

			{/* View Image */}
			<Dialog
				fullScreen={fullScreen}
				open={openViewImage}
				onClose={handleClose}
			>
				<DialogTitle>Analysis Image</DialogTitle>
				<IconButton
					aria-label='close'
					onClick={handleClose}
					size='small'
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
					}}
				>
					<CloseIcon />
				</IconButton>

				<DialogContent>
					{isLoading ? (
						<CircularProgress />
					) : rawImage !== "" && annotatedImage !== "" ? (
						<>
							<DialogContentText
								display={"flex"}
								justifyContent={"center"}
								py={2}
							>
								<Image
									src={rawImage}
									width={500}
									height={500}
									alt='Raw Image'
								/>
							</DialogContentText>
							<DialogContentText
								display={"flex"}
								justifyContent={"center"}
								py={2}
							>
								<FaArrowAltCircleDown size={"2em"} />
							</DialogContentText>
							<DialogContentText
								display={"flex"}
								justifyContent={"center"}
								py={2}
							>
								<Image
									src={annotatedImage}
									width={500}
									height={500}
									alt='Annotated Image'
								/>
							</DialogContentText>
						</>
					) : (
						<></>
					)}
				</DialogContent>
			</Dialog>
		</>
	) : (
		<NotFoundComponet notfound='No Analysis. Please refresh the page.' />
	);
};

export default AnalysisTable;
