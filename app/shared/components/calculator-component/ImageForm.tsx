"use client";
import { DeleteIcon } from "@chakra-ui/icons";
import {
	Box,
	Button,
	Center,
	Flex,
	FormControl,
	Input,
	Text,
	useToast,
} from "@chakra-ui/react";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { VscCloudUpload } from "react-icons/vsc";
import { FaFileUpload } from "react-icons/fa";
import { ResponseImage } from "@/(desap)/ento/calculator/page";

type ImageFormProps = {
	onImageUpload: (image: string, rawImage: File | null) => Promise<void>;
	setResponseImage: Dispatch<SetStateAction<any>>;
	responseImage?: ResponseImage;
};

const ImageForm = ({
	onImageUpload,
	setResponseImage,
	responseImage,
}: ImageFormProps) => {
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [displayUpload, setDisplayUpload] = useState<File | null>(null);
	const toast = useToast();
	const convertBase64 = (file: Blob | null) => {
		return new Promise<string>((resolve, reject) => {
			const fileReader = new FileReader();
			if (file) {
				fileReader.readAsDataURL(file);
			} else {
				reject(new Error("Invalid file"));
			}

			fileReader.onload = () => {
				resolve(fileReader.result as string);
			};

			fileReader.onerror = (error) => {
				reject(error);
			};
		});
	};

	const imageChange = async (e: any) => {
		const file = e.target.files ? e.target.files[0] : null;
		setDisplayUpload(file);
	};

	const removeSelectedImage = () => {
		setDisplayUpload(null);
		setSelectedImage(null);
		setResponseImage(null);
	};

	const handleSubmit = async () => {
		if (!displayUpload) {
			toast({
				title: "Please upload an image",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "bottom-right",
			});
			return;
		}
		const base64 = await convertBase64(displayUpload);
		onImageUpload(base64, displayUpload);
	};

	return (
		<Flex direction={"column"}>
			<Box
				maxW='800px'
				minW='400px'
				borderWidth='1px'
				borderRadius='lg'
				overflow='hidden'
			>
				{displayUpload ? (
					<Box textAlign={"center"} padding={2}>
						<Flex align='center' justify='center'>
							<Text fontWeight='bold'>Uploaded Image</Text>
							<FaFileUpload style={{ marginLeft: "0.5rem" }} />
						</Flex>
						<Image
							src={URL.createObjectURL(displayUpload)}
							width={500}
							height={360}
							alt='Uploaded image'
						/>
						<Button
							onClick={removeSelectedImage}
							rightIcon={<DeleteIcon />}
							marginTop={2}
							background={"red.500"}
						>
							Remove This Image
						</Button>
					</Box>
				) : (
					<>
						<Box textAlign='center' padding={2}>
							<Flex align='center' justify='center'>
								<Text fontWeight='bold'>Upload your image</Text>
								<VscCloudUpload
									style={{ marginLeft: "0.5rem" }}
								/>
							</Flex>
							<Text>File should be of format .JPG</Text>
						</Box>
						<FormControl isRequired padding={2}>
							<Flex justify={"center"}>
								<Input
									type='file'
									onChange={imageChange}
									display={"none"}
									id='fileInput'
								/>
								<label htmlFor='fileInput'>
									<Button as='span'>Choose File</Button>
								</label>
							</Flex>
						</FormControl>
					</>
				)}
			</Box>
			{!responseImage && (
				<Center padding={10}>
					<Button type='submit' onClick={handleSubmit}>
						Analyze Image
					</Button>
				</Center>
			)}
		</Flex>
	);
};

export default ImageForm;
