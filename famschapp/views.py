from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .serializers import RegisterSerializer, UserSerializer, EventSerializer
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
from .models import Event, Family

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "User created successfully!",
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginAPI(generics.GenericAPIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=400)

class EventAPI(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(
            models.Q(creator=user) | 
            models.Q(family__members=user)
        ).distinct().order_by('start_time')

    def perform_create(self, serializer):
        user_family = self.request.user.families.first()
        serializer.save(creator=self.request.user, family=user_family)

class EventDetailAPI(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.all()

    def get_queryset(self):
        user = self.request.user
        return Event.objects.filter(
            models.Q(creator=user) | 
            models.Q(family__members=user)
        ).distinct()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class WeekEventsAPI(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Event.objects.none()
        else:
            start_date = timezone.now() - timedelta(days=timezone.now().weekday())
            end_date = start_date + timedelta(days=7)
        
        return Event.objects.filter(
            (models.Q(creator=user) | models.Q(family__members=user)),
            start_time__date__range=(start_date, end_date)
        ).distinct().order_by('start_time')

class FamilyMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        families = request.user.families.all()
        members = set()
        
        for family in families:
            members.update(family.members.all())
        
        # Добавляем самого пользователя
        members.add(request.user)
        
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)